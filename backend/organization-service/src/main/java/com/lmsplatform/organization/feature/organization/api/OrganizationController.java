package com.lmsplatform.organization.feature.organization.api;

import com.lmsplatform.organization.feature.organization.application.OrganizationService;
import com.lmsplatform.organization.feature.organization.domain.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

record AcceptInviteRequest(UUID userId, String userEmail) {}

@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {
    private final OrganizationService organizations;

    public OrganizationController(OrganizationService organizations) {
        this.organizations = organizations;
    }

    @GetMapping
    public List<OrganizationDto> list(@RequestParam(value = "type", required = false) String type) {
        return organizations.list(type);
    }

    @PostMapping
    public OrganizationDto create(@Valid @RequestBody OrganizationCreateRequest request) {
        return organizations.create(request);
    }

    @GetMapping("/platform-stats")
    public PlatformStatsDto platformStats() {
        return organizations.platformStats();
    }

    @PostMapping("/company-registration")
    public CompanyRegistrationDto registerCompany(@Valid @RequestBody CompanyRegisterRequest request) {
        return organizations.registerCompany(request);
    }

    @GetMapping("/{id}")
    public OrganizationDto get(@PathVariable("id") UUID id) {
        return organizations.get(id);
    }

    record UpdateDocumentRequest(String docType, UUID fileId) {}

    @PatchMapping("/{id}/documents")
    public OrganizationDto updateDocuments(@PathVariable("id") UUID id,
                                           @RequestBody UpdateDocumentRequest request) {
        return organizations.updateDocuments(id, request.docType(), request.fileId());
    }

    // ─── Partner requests ────────────────────────────────────────────────────

    @PostMapping("/partner-requests")
    public PartnerRequestDto requestPartner(@Valid @RequestBody PartnerRequestCreateRequest request) {
        return organizations.requestPartner(request);
    }

    @GetMapping("/partner-requests")
    public List<PartnerRequestDto> partnerRequests() {
        return organizations.partnerRequests();
    }

    @PostMapping("/partner-requests/{id}/approve")
    public OrganizationDto approvePartner(@PathVariable("id") UUID id) {
        return organizations.approvePartner(id);
    }

    @PostMapping("/partner-requests/{id}/reject")
    public PartnerRequestDto rejectPartner(@PathVariable("id") UUID id,
                                           @RequestBody(required = false) PartnerReviewRequest request) {
        return organizations.rejectPartner(id, request != null ? request.reason() : null);
    }

    @PostMapping("/partner-requests/{id}/rework")
    public PartnerRequestDto reworkPartner(@PathVariable("id") UUID id,
                                           @RequestBody(required = false) PartnerReviewRequest request) {
        return organizations.reworkPartner(id, request != null ? request.reason() : null);
    }

    // ─── Members ─────────────────────────────────────────────────────────────

    @PostMapping("/{organizationId}/members")
    public MemberDto addMember(@PathVariable("organizationId") UUID organizationId,
                               @Valid @RequestBody MemberCreateRequest request) {
        return organizations.addMember(organizationId, request);
    }

    @GetMapping("/{organizationId}/members")
    public List<MemberDto> members(@PathVariable("organizationId") UUID organizationId) {
        return organizations.members(organizationId);
    }

    // ─── Invites ─────────────────────────────────────────────────────────────

    @PostMapping("/{organizationId}/invites")
    public InviteDto createInvite(@PathVariable("organizationId") UUID organizationId,
                                  @Valid @RequestBody InviteCreateRequest request) {
        return organizations.createInvite(organizationId, request);
    }

    @GetMapping("/{organizationId}/invites")
    public List<InviteDto> orgInvites(@PathVariable("organizationId") UUID organizationId) {
        return organizations.invitesForOrg(organizationId);
    }

    /** Called from profile page — lists pending invites for the given email */
    @GetMapping("/invites/mine")
    public List<InviteDto> myInvites(@RequestParam("email") String email) {
        return organizations.invitesForEmail(email);
    }

    /** User accepts an invite by inviteId + proves identity with userId + email */
    @PostMapping("/invites/{inviteId}/accept")
    public MemberDto acceptInvite(@PathVariable("inviteId") UUID inviteId,
                                  @RequestBody AcceptInviteRequest request) {
        return organizations.acceptInvite(inviteId, request.userId(), request.userEmail());
    }
}
