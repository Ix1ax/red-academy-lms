package com.lmsplatform.organization.feature.organization.application;

import com.lmsplatform.organization.feature.organization.domain.*;
import com.lmsplatform.organization.shared.messaging.EventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class OrganizationService {
    private final JdbcTemplate jdbc;
    private final EventPublisher events;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public OrganizationService(JdbcTemplate jdbc, EventPublisher events) {
        this.jdbc = jdbc;
        this.events = events;
    }

    public List<OrganizationDto> list(String type) {
        if (type == null || type.isBlank()) {
            return jdbc.query("""
                    SELECT id, name, type, status, description, inn, ogrn, created_at, doc_inn_id, doc_egrul_id, doc_charter_id, doc_poa_id
                    FROM organization.organizations
                    ORDER BY created_at DESC
                    """, (rs, rowNum) -> mapOrganization(rs));
        }
        return jdbc.query("""
                SELECT id, name, type, status, description, inn, ogrn, created_at, doc_inn_id, doc_egrul_id, doc_charter_id, doc_poa_id
                FROM organization.organizations
                WHERE type = ?
                ORDER BY created_at DESC
                """, (rs, rowNum) -> mapOrganization(rs), type);
    }

    public OrganizationDto create(OrganizationCreateRequest request) {
        var id = UUID.randomUUID();
        jdbc.update("""
                        INSERT INTO organization.organizations (id, name, type, status, description)
                        VALUES (?, ?, ?, ?, ?)
                        """, id, request.name(), request.type(), "ACTIVE", request.description());
        events.publish("organization.created", Map.of("organizationId", id.toString(), "type", request.type()));
        return get(id);
    }

    public PlatformStatsDto platformStats() {
        return new PlatformStatsDto(
                count("SELECT count(*) FROM identity.users WHERE role IN ('STUDENT', 'CORPORATE_STUDENT')"),
                count("SELECT count(*) FROM organization.organizations WHERE status = 'ACTIVE' AND type IN ('COMPANY', 'PARTNER', 'CORPORATE_CLIENT')"),
                count("SELECT count(*) FROM learning.courses WHERE status = 'PUBLISHED'"),
                count("SELECT count(*) FROM learning.courses WHERE status = 'PUBLISHED' AND course_type = 'PUBLIC'"),
                count("SELECT count(*) FROM learning.courses WHERE status = 'PUBLISHED' AND course_type = 'COMPANY'"),
                count("SELECT count(*) FROM learning.intensives"),
                count("SELECT count(*) FROM organization.partner_requests WHERE status = 'PENDING'")
        );
    }

    public CompanyRegistrationDto registerCompany(CompanyRegisterRequest request) {
        var organization = create(new OrganizationCreateRequest(
                request.companyName(),
                "CORPORATE_CLIENT",
                request.description() == null || request.description().isBlank()
                        ? "Компания зарегистрировалась на платформе"
                        : request.description()
        ));
        // Store INN and OGRN if provided
        if (request.inn() != null || request.ogrn() != null) {
            jdbc.update("UPDATE organization.organizations SET inn = ?, ogrn = ?, updated_at = now() WHERE id = ?",
                    request.inn(), request.ogrn(), organization.id());
        }
        var managerId = UUID.randomUUID();
        try {
            jdbc.update("""
                            INSERT INTO identity.users (id, email, password_hash, full_name, role, organization_id)
                            VALUES (?, ?, ?, ?, 'PARTNER_MANAGER', ?)
                            """,
                    managerId,
                    request.contactEmail().toLowerCase(),
                    passwordEncoder.encode(request.password()),
                    request.managerFullName() == null || request.managerFullName().isBlank()
                            ? "Менеджер " + request.companyName()
                            : request.managerFullName(),
                    organization.id());
        } catch (DataIntegrityViolationException e) {
            // Roll back the organization creation by deleting it
            jdbc.update("DELETE FROM organization.organizations WHERE id = ?", organization.id());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Этот email уже зарегистрирован");
        }
        addMember(organization.id(), new MemberCreateRequest(managerId, "PARTNER_MANAGER"));
        events.publish("organization.company_registered", Map.of(
                "organizationId", organization.id().toString(),
                "managerUserId", managerId.toString()
        ));
        return new CompanyRegistrationDto(organization, managerId);
    }

    public OrganizationDto get(UUID id) {
        var rows = jdbc.query("""
                SELECT id, name, type, status, description, inn, ogrn, created_at, doc_inn_id, doc_egrul_id, doc_charter_id, doc_poa_id
                FROM organization.organizations
                WHERE id = ?
                """, (rs, rowNum) -> mapOrganization(rs), id);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Organization not found");
        }
        return rows.get(0);
    }

    public PartnerRequestDto requestPartner(PartnerRequestCreateRequest request) {
        if (request.organizationId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Partner request must be linked to a registered company");
        }
        var organization = get(request.organizationId());
        if ("MAIN_COMPANY".equals(organization.type())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Main company cannot request partnership with itself");
        }
        if ("PARTNER".equals(organization.type())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Organization is already a partner");
        }
        var pendingRequests = count("""
                SELECT count(*)
                FROM organization.partner_requests
                WHERE organization_id = ? AND status = 'PENDING'
                """, request.organizationId());
        if (pendingRequests > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Organization already has a pending partner request");
        }
        var managers = count("""
                SELECT count(*)
                FROM identity.users
                WHERE organization_id = ?
                  AND lower(email) = lower(?)
                  AND role IN ('PARTNER_MANAGER', 'ADMIN')
                """, request.organizationId(), request.contactEmail());
        if (managers == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Partner request contact must be an organization manager");
        }
        var id = UUID.randomUUID();
        jdbc.update("""
                        INSERT INTO organization.partner_requests (id, organization_id, company_name, contact_email, description, status)
                        VALUES (?, ?, ?, ?, ?, 'PENDING')
                        """, id, organization.id(), organization.name(), request.contactEmail(), request.description());
        events.publish("organization.partner_requested", Map.of(
                "requestId", id.toString(),
                "organizationId", organization.id().toString(),
                "companyName", organization.name()
        ));
        return getPartnerRequest(id);
    }

    public List<PartnerRequestDto> partnerRequests() {
        return jdbc.query("""
                SELECT pr.id, pr.organization_id, pr.company_name, pr.contact_email, pr.description, pr.status, pr.created_at, pr.reviewed_at, pr.review_reason
                FROM organization.partner_requests pr
                LEFT JOIN organization.organizations o ON o.id = pr.organization_id
                WHERE o.type IS NULL OR o.type <> 'MAIN_COMPANY'
                ORDER BY pr.created_at DESC
                """, (rs, rowNum) -> mapPartnerRequest(rs));
    }

    public OrganizationDto approvePartner(UUID id) {
        var request = getPartnerRequest(id);
        if (!"PENDING".equals(request.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request is already reviewed");
        }
        jdbc.update("""
                        UPDATE organization.partner_requests
                        SET status = 'APPROVED', reviewed_at = now(), review_reason = NULL
                        WHERE id = ?
                        """, id);
        OrganizationDto organization;
        if (request.organizationId() == null) {
            organization = create(new OrganizationCreateRequest(request.companyName(), "PARTNER", request.description()));
        } else {
            jdbc.update("""
                            UPDATE organization.organizations
                            SET type = 'PARTNER', updated_at = now()
                            WHERE id = ?
                            """, request.organizationId());
            jdbc.update("""
                            UPDATE organization.organization_members
                            SET role = 'PARTNER_MANAGER'
                            WHERE organization_id = ? AND role = 'PARTNER_MANAGER'
                            """, request.organizationId());
            jdbc.update("""
                            UPDATE identity.users
                            SET role = 'PARTNER_MANAGER', updated_at = now()
                            WHERE organization_id = ? AND role = 'PARTNER_MANAGER'
                            """, request.organizationId());
            organization = get(request.organizationId());
        }
        events.publish("organization.partner_approved", Map.of(
                "requestId", id.toString(),
                "organizationId", organization.id().toString()
        ));
        return organization;
    }

    public MemberDto addMember(UUID organizationId, MemberCreateRequest request) {
        get(organizationId);
        var id = UUID.randomUUID();
        jdbc.update("""
                        INSERT INTO organization.organization_members (id, organization_id, user_id, role, status)
                        VALUES (?, ?, ?, ?, 'ACTIVE')
                        ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = 'ACTIVE'
                        """, id, organizationId, request.userId(), request.role());
        jdbc.update("""
                        UPDATE identity.users
                        SET organization_id = ?,
                            role = CASE
                                WHEN ? IN ('PARTNER_MANAGER', 'MENTOR') THEN ?
                                ELSE 'CORPORATE_STUDENT'
                            END,
                            updated_at = now()
                        WHERE id = ?
                        """, organizationId, request.role(), request.role(), request.userId());
        events.publish("organization.employee_invited", Map.of(
                "organizationId", organizationId.toString(),
                "userId", request.userId().toString()
        ));
        return members(organizationId).stream()
                .filter(member -> member.userId().equals(request.userId()))
                .findFirst()
                .orElse(new MemberDto(id, organizationId, request.userId(), request.role(), "ACTIVE", null, null));
    }

    public PartnerRequestDto rejectPartner(UUID id, String reason) {
        var request = getPartnerRequest(id);
        if (!"PENDING".equals(request.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request is already reviewed");
        }
        jdbc.update("""
                        UPDATE organization.partner_requests
                        SET status = 'REJECTED', reviewed_at = now(), review_reason = ?
                        WHERE id = ?
                        """, reason, id);
        events.publish("organization.partner_rejected", Map.of(
                "requestId", id.toString(),
                "reason", reason == null ? "" : reason
        ));
        return getPartnerRequest(id);
    }

    public PartnerRequestDto reworkPartner(UUID id, String reason) {
        var request = getPartnerRequest(id);
        if (!"PENDING".equals(request.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request is already reviewed");
        }
        jdbc.update("""
                        UPDATE organization.partner_requests
                        SET status = 'REWORK', reviewed_at = now(), review_reason = ?
                        WHERE id = ?
                        """, reason, id);
        events.publish("organization.partner_rework", Map.of(
                "requestId", id.toString(),
                "reason", reason == null ? "" : reason
        ));
        return getPartnerRequest(id);
    }

    // ─── Invites ──────────────────────────────────────────────────────────────

    public InviteDto createInvite(UUID organizationId, InviteCreateRequest request) {
        get(organizationId);
        var id = UUID.randomUUID();
        try {
            jdbc.update("""
                            INSERT INTO organization.org_invites
                                (id, organization_id, email, role, status, message)
                            VALUES (?, ?, lower(?), 'CORPORATE_STUDENT', 'PENDING', ?)
                            """, id, organizationId, request.email(), request.message());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Pending invite already exists for this email");
        }
        var rows = jdbc.query("""
                SELECT i.id, i.organization_id, o.name AS name, i.email, i.role, i.status,
                       i.message, i.created_at, i.accepted_at
                FROM organization.org_invites i
                JOIN organization.organizations o ON o.id = i.organization_id
                WHERE i.id = ?
                """, (rs, rowNum) -> mapInvite(rs), id);
        return rows.get(0);
    }

    public List<InviteDto> invitesForEmail(String email) {
        return jdbc.query("""
                SELECT i.id, i.organization_id, o.name AS name, i.email, i.role, i.status,
                       i.message, i.created_at, i.accepted_at
                FROM organization.org_invites i
                JOIN organization.organizations o ON o.id = i.organization_id
                WHERE lower(i.email) = lower(?) AND i.status = 'PENDING'
                ORDER BY i.created_at DESC
                """, (rs, rowNum) -> mapInvite(rs), email);
    }

    public List<InviteDto> invitesForOrg(UUID organizationId) {
        return jdbc.query("""
                SELECT i.id, i.organization_id, o.name AS name, i.email, i.role, i.status,
                       i.message, i.created_at, i.accepted_at
                FROM organization.org_invites i
                JOIN organization.organizations o ON o.id = i.organization_id
                WHERE i.organization_id = ?
                ORDER BY i.created_at DESC
                LIMIT 50
                """, (rs, rowNum) -> mapInvite(rs), organizationId);
    }

    public MemberDto acceptInvite(UUID inviteId, UUID userId, String userEmail) {
        var rows = jdbc.query("""
                SELECT i.id, i.organization_id, o.name AS name, i.email, i.role, i.status,
                       i.message, i.created_at, i.accepted_at
                FROM organization.org_invites i
                JOIN organization.organizations o ON o.id = i.organization_id
                WHERE i.id = ?
                """, (rs, rowNum) -> mapInvite(rs), inviteId);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invite not found");
        }
        var invite = rows.get(0);
        if (!"PENDING".equals(invite.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invite already used");
        }
        if (!invite.email().equalsIgnoreCase(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This invite belongs to a different email");
        }
        jdbc.update("""
                        UPDATE organization.org_invites
                        SET status = 'ACCEPTED', accepted_at = now()
                        WHERE id = ?
                        """, inviteId);
        return addMember(invite.organizationId(), new MemberCreateRequest(userId, invite.role()));
    }

    private InviteDto mapInvite(ResultSet rs) throws SQLException {
        var acceptedAt = rs.getTimestamp("accepted_at");
        return new InviteDto(
                rs.getObject("id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getString("name"),
                rs.getString("email"),
                rs.getString("role"),
                rs.getString("status"),
                rs.getString("message"),
                rs.getTimestamp("created_at").toInstant(),
                acceptedAt == null ? null : acceptedAt.toInstant()
        );
    }

    public List<MemberDto> members(UUID organizationId) {
        return jdbc.query("""
                SELECT m.id, m.organization_id, m.user_id, m.role, m.status, u.email, u.full_name
                FROM organization.organization_members m
                LEFT JOIN identity.users u ON u.id = m.user_id
                WHERE m.organization_id = ?
                ORDER BY m.created_at DESC
                """, (rs, rowNum) -> new MemberDto(
                rs.getObject("id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getString("role"),
                rs.getString("status"),
                rs.getString("email"),
                rs.getString("full_name")
        ), organizationId);
    }

    private PartnerRequestDto getPartnerRequest(UUID id) {
        var rows = jdbc.query("""
                SELECT id, organization_id, company_name, contact_email, description, status, created_at, reviewed_at
                FROM organization.partner_requests
                WHERE id = ?
                """, (rs, rowNum) -> mapPartnerRequest(rs), id);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Partner request not found");
        }
        return rows.get(0);
    }

    private int count(String sql) {
        var result = jdbc.queryForObject(sql, Long.class);
        return result == null ? 0 : Math.toIntExact(result);
    }

    private int count(String sql, Object... args) {
        var result = jdbc.queryForObject(sql, Long.class, args);
        return result == null ? 0 : Math.toIntExact(result);
    }

    private OrganizationDto mapOrganization(ResultSet rs) throws SQLException {
        return new OrganizationDto(
                rs.getObject("id", UUID.class),
                rs.getString("name"),
                rs.getString("type"),
                rs.getString("status"),
                rs.getString("description"),
                rs.getString("inn"),
                rs.getString("ogrn"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getObject("doc_inn_id", UUID.class),
                rs.getObject("doc_egrul_id", UUID.class),
                rs.getObject("doc_charter_id", UUID.class),
                rs.getObject("doc_poa_id", UUID.class)
        );
    }

    public OrganizationDto updateDocuments(UUID organizationId, String docType, UUID fileId) {
        String column = switch (docType) {
            case "inn" -> "doc_inn_id";
            case "egrul" -> "doc_egrul_id";
            case "charter" -> "doc_charter_id";
            case "poa" -> "doc_poa_id";
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown document type: " + docType);
        };
        jdbc.update("UPDATE organization.organizations SET " + column + " = ?, updated_at = now() WHERE id = ?",
                fileId, organizationId);
        return get(organizationId);
    }

    private PartnerRequestDto mapPartnerRequest(ResultSet rs) throws SQLException {
        var reviewedAt = rs.getTimestamp("reviewed_at");
        return new PartnerRequestDto(
                rs.getObject("id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getString("company_name"),
                rs.getString("contact_email"),
                rs.getString("description"),
                rs.getString("status"),
                rs.getTimestamp("created_at").toInstant(),
                reviewedAt == null ? null : reviewedAt.toInstant(),
                rs.getString("review_reason")
        );
    }
}
