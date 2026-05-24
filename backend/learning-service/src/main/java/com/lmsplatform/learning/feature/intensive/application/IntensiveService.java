package com.lmsplatform.learning.feature.intensive.application;

import com.lmsplatform.learning.feature.intensive.domain.*;
import com.lmsplatform.learning.shared.messaging.EventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.Duration;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class IntensiveService {
    private final JdbcTemplate jdbc;
    private final EventPublisher events;

    public IntensiveService(JdbcTemplate jdbc, EventPublisher events) {
        this.jdbc = jdbc;
        this.events = events;
    }

    public List<IntensiveDto> list() {
        return jdbc.query("""
                SELECT id, title, description, organizer_type, organization_id, status, starts_at, ends_at,
                       registration_deadline, cover_url, participant_limit, created_at
                FROM learning.intensives
                ORDER BY starts_at ASC
                """, (rs, rowNum) -> mapIntensive(rs));
    }

    public IntensiveDto create(IntensiveCreateRequest request) {
        var id = UUID.randomUUID();
        var registrationDeadline = parseOptionalDateTime(request.registrationDeadline(), request.startsAt());
        jdbc.update("""
                        INSERT INTO learning.intensives (id, title, description, organizer_type, organization_id, status,
                            starts_at, ends_at, registration_deadline, cover_url, participant_limit)
                        VALUES (?, ?, ?, ?, ?, 'ENROLLMENT_OPEN', ?, ?, ?, ?, ?)
                        """,
                id, request.title(), request.description(), request.organizerType(), request.organizationId(),
                OffsetDateTime.parse(request.startsAt()), OffsetDateTime.parse(request.endsAt()),
                registrationDeadline, request.coverUrl(), request.participantLimit());
        createStages(id, request.startsAt(), request.endsAt(), request.stages());
        for (var managerUserId : managerUserIds(request)) {
                addManager(id, new IntensiveManagerCreateRequest(managerUserId, request.organizationId()));
        }
        events.publish("intensive.created", Map.of("intensiveId", id.toString()));
        return findIntensive(id);
    }

    public IntensiveDto update(UUID id, IntensiveCreateRequest request) {
        findIntensive(id);
        var registrationDeadline = parseOptionalDateTime(request.registrationDeadline(), request.startsAt());
        jdbc.update("""
                        UPDATE learning.intensives
                        SET title = ?,
                            description = ?,
                            organizer_type = ?,
                            organization_id = ?,
                            starts_at = ?,
                            ends_at = ?,
                            registration_deadline = ?,
                            cover_url = ?,
                            participant_limit = ?,
                            updated_at = now()
                        WHERE id = ?
                        """,
                request.title(), request.description(), request.organizerType(), request.organizationId(),
                OffsetDateTime.parse(request.startsAt()), OffsetDateTime.parse(request.endsAt()),
                registrationDeadline, request.coverUrl(), request.participantLimit(), id);
        jdbc.update("DELETE FROM learning.tasks WHERE intensive_id = ?", id);
        jdbc.update("DELETE FROM learning.intensive_stages WHERE intensive_id = ?", id);
        jdbc.update("DELETE FROM learning.intensive_managers WHERE intensive_id = ?", id);
        createStages(id, request.startsAt(), request.endsAt(), request.stages());
        for (var managerUserId : managerUserIds(request)) {
                addManager(id, new IntensiveManagerCreateRequest(managerUserId, request.organizationId()));
        }
        events.publish("intensive.updated", Map.of("intensiveId", id.toString()));
        return findIntensive(id);
    }

    public void delete(UUID id) {
        findIntensive(id);
        jdbc.update("DELETE FROM learning.tasks WHERE intensive_id = ?", id);
        jdbc.update("DELETE FROM learning.intensives WHERE id = ?", id);
        events.publish("intensive.deleted", Map.of("intensiveId", id.toString()));
    }

    public IntensiveDto updateStatus(UUID id, String status) {
        findIntensive(id);
        var normalized = normalizeIntensiveStatus(status);
        jdbc.update("UPDATE learning.intensives SET status = ?, updated_at = now() WHERE id = ?", normalized, id);
        events.publish("intensive.status_changed", Map.of("intensiveId", id.toString(), "status", normalized));
        return findIntensive(id);
    }

    public IntensiveDetailsDto get(UUID id) {
        var intensive = findIntensive(id);
        var stages = jdbc.query("""
                SELECT id, intensive_id, title, description, task_title, task_description, answer_type, position, starts_at, ends_at
                FROM learning.intensive_stages
                WHERE intensive_id = ?
                ORDER BY position ASC
                """, (rs, rowNum) -> new IntensiveStageDto(
                rs.getObject("id", UUID.class),
                rs.getObject("intensive_id", UUID.class),
                rs.getString("title"),
                rs.getString("description"),
                rs.getString("task_title"),
                rs.getString("task_description"),
                rs.getString("answer_type"),
                rs.getInt("position"),
                rs.getTimestamp("starts_at").toInstant(),
                rs.getTimestamp("ends_at").toInstant()
        ), id);
        return new IntensiveDetailsDto(intensive, stages, rating(id), applications(id), submissions(id));
    }

    public ApplicationDto apply(UUID intensiveId, ApplicationRequest request) {
        var intensive = findIntensive(intensiveId);
        if (request.organizationId() != null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Company users can view intensives but cannot participate");
        }
        var deadline = intensive.registrationDeadline() != null ? intensive.registrationDeadline() : intensive.startsAt();
        if (!Instant.now().isBefore(deadline)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Registration deadline has passed");
        }
        if (request.githubUrl() == null || request.githubUrl().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "GitHub profile is required");
        }
        var githubProfile = normalizeGithubProfile(request.githubUrl());
        if (hasParticipantStatus(intensiveId, request.userId(), "ELIMINATED")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Eliminated participants cannot apply again");
        }
        if (hasParticipant(intensiveId, request.userId()) || hasApplication(intensiveId, request.userId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already applied to this intensive");
        }
        var applicationId = UUID.randomUUID();
        jdbc.update("""
                        INSERT INTO learning.intensive_applications (id, intensive_id, user_id, organization_id, github_url, status)
                        VALUES (?, ?, ?, ?, ?, 'PENDING')
                        """, applicationId, intensiveId, request.userId(), request.organizationId(), githubProfile);
        events.publish("intensive.application_submitted", Map.of("intensiveId", intensiveId.toString()));
        return findApplication(applicationId);
    }

    public ParticipantDto approve(UUID applicationId) {
        var application = findApplication(applicationId);
        if ("REJECTED".equals(application.status())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Rejected application cannot be approved");
        }
        jdbc.update("UPDATE learning.intensive_applications SET status = 'APPROVED' WHERE id = ?", applicationId);
        var participantId = UUID.randomUUID();
        jdbc.update("""
                        INSERT INTO learning.intensive_participants (id, intensive_id, user_id, organization_id, github_url, score, status)
                        VALUES (?, ?, ?, ?, ?, 0, 'ACTIVE')
                        ON CONFLICT (intensive_id, user_id) DO NOTHING
                        """, participantId, application.intensiveId(), application.userId(), application.organizationId(), application.githubUrl());
        events.publish("intensive.application_approved", Map.of(
                "intensiveId", application.intensiveId().toString(),
                "userId", application.userId().toString()
        ));
        return findParticipantByUser(application.intensiveId(), application.userId());
    }

    public ApplicationDto reject(UUID applicationId) {
        var application = findApplication(applicationId);
        if ("APPROVED".equals(application.status())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Approved application already became a participant");
        }
        jdbc.update("UPDATE learning.intensive_applications SET status = 'REJECTED' WHERE id = ?", applicationId);
        events.publish("intensive.application_rejected", Map.of(
                "intensiveId", application.intensiveId().toString(),
                "userId", application.userId().toString()
        ));
        return findApplication(applicationId);
    }

    public List<ParticipantDto> rating(UUID intensiveId) {
        return jdbc.query("""
                SELECT p.id, p.intensive_id, p.user_id, p.organization_id, p.github_url, p.score, p.status,
                       u.email, u.full_name
                FROM learning.intensive_participants p
                LEFT JOIN identity.users u ON u.id = p.user_id
                WHERE p.intensive_id = ?
                ORDER BY p.score DESC
                """, (rs, rowNum) -> new ParticipantDto(
                rs.getObject("id", UUID.class),
                rs.getObject("intensive_id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getString("github_url"),
                rs.getInt("score"),
                rs.getString("status"),
                rs.getString("email"),
                rs.getString("full_name")
        ), intensiveId);
    }

    public List<IntensiveManagerDto> managers(UUID intensiveId) {
        findIntensive(intensiveId);
        return jdbc.query("""
                SELECT id, intensive_id, user_id, organization_id, role, status
                FROM learning.intensive_managers
                WHERE intensive_id = ?
                ORDER BY created_at DESC
                """, (rs, rowNum) -> mapManager(rs), intensiveId);
    }

    private List<ApplicationDto> applications(UUID intensiveId) {
        return jdbc.query("""
                SELECT a.id, a.intensive_id, a.user_id, a.organization_id, a.github_url, a.status,
                       u.email, u.full_name
                FROM learning.intensive_applications a
                LEFT JOIN identity.users u ON u.id = a.user_id
                WHERE a.intensive_id = ?
                ORDER BY a.created_at DESC
                """, (rs, rowNum) -> new ApplicationDto(
                rs.getObject("id", UUID.class),
                rs.getObject("intensive_id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getString("github_url"),
                rs.getString("status"),
                rs.getString("email"),
                rs.getString("full_name")
        ), intensiveId);
    }

    private List<IntensiveSubmissionDto> submissions(UUID intensiveId) {
        return jdbc.query("""
                SELECT s.id, s.task_id, s.user_id, s.github_url, s.answer_text, s.status, s.score, s.submitted_at,
                       st.title AS stage_title, u.email, u.full_name, s.reviewer_comment
                FROM learning.task_submissions s
                JOIN learning.tasks t ON t.id = s.task_id
                LEFT JOIN learning.intensive_stages st ON st.id = t.intensive_stage_id
                LEFT JOIN identity.users u ON u.id = s.user_id
                WHERE t.intensive_id = ?
                ORDER BY s.submitted_at DESC
                """, (rs, rowNum) -> new IntensiveSubmissionDto(
                rs.getObject("id", UUID.class),
                rs.getObject("task_id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getString("github_url"),
                rs.getString("answer_text"),
                rs.getString("status"),
                rs.getObject("score", Integer.class),
                rs.getTimestamp("submitted_at").toInstant(),
                rs.getString("stage_title"),
                rs.getString("email"),
                rs.getString("full_name"),
                rs.getString("reviewer_comment")
        ), intensiveId);
    }

    public IntensiveManagerDto addManager(UUID intensiveId, IntensiveManagerCreateRequest request) {
        if (request.userId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Manager userId is required");
        }
        var intensive = findIntensive(intensiveId);
        var organizationId = request.organizationId() == null ? intensive.organizationId() : request.organizationId();
        if (organizationId == null || !organizationId.equals(intensive.organizationId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Manager must belong to the organization running the intensive");
        }
        var id = UUID.randomUUID();
        jdbc.update("""
                        INSERT INTO learning.intensive_managers (id, intensive_id, user_id, organization_id, role, status)
                        VALUES (?, ?, ?, ?, 'INTENSIVE_MANAGER', 'ACTIVE')
                        ON CONFLICT (intensive_id, user_id) DO UPDATE SET status = 'ACTIVE'
                        """, id, intensiveId, request.userId(), organizationId);
        events.publish("intensive.manager_assigned", Map.of(
                "intensiveId", intensiveId.toString(),
                "userId", request.userId().toString()
        ));
        return managers(intensiveId).stream()
                .filter(manager -> manager.userId().equals(request.userId()))
                .findFirst()
                .orElse(new IntensiveManagerDto(id, intensiveId, request.userId(), organizationId, "INTENSIVE_MANAGER", "ACTIVE"));
    }

    public ParticipantDto kickParticipant(UUID intensiveId, UUID participantId, KickParticipantRequest request) {
        if (request.managerUserId() == null || (!isActiveManager(intensiveId, request.managerUserId()) && !isOrganizerManager(intensiveId, request.managerUserId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only an active intensive manager can remove participants");
        }
        var updated = jdbc.update("""
                UPDATE learning.intensive_participants
                SET status = 'ELIMINATED', eliminated_at = now(), eliminated_by = ?, elimination_reason = ?
                WHERE id = ? AND intensive_id = ?
                """, request.managerUserId(), request.reason(), participantId, intensiveId);
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found");
        }
        events.publish("intensive.participant_eliminated", Map.of(
                "intensiveId", intensiveId.toString(),
                "participantId", participantId.toString()
        ));
        return findParticipant(intensiveId, participantId);
    }

    public IntensiveSubmissionDto submitStage(UUID intensiveId, UUID stageId, IntensiveSubmissionRequest request) {
        findIntensive(intensiveId);
        if (request.githubUrl() == null || request.githubUrl().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "GitHub profile is required");
        }
        var githubProfile = normalizeGithubProfile(request.githubUrl());
        var participant = findParticipantByUser(intensiveId, request.userId());
        if (!"ACTIVE".equals(participant.status())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only active intensive participants can submit stages");
        }
        if (Instant.now().isBefore(stageStartsAt(intensiveId, stageId))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Stage is not open yet");
        }
        var taskId = taskForStage(intensiveId, stageId);
        var submissionId = UUID.randomUUID();
        jdbc.update("""
                        INSERT INTO learning.task_submissions (id, task_id, user_id, answer_text, github_url, status)
                        VALUES (?, ?, ?, ?, ?, 'SUBMITTED')
                        ON CONFLICT (task_id, user_id)
                        DO UPDATE SET answer_text = EXCLUDED.answer_text,
                                      github_url = EXCLUDED.github_url,
                                      status = 'SUBMITTED',
                                      submitted_at = now()
                        """, submissionId, taskId, request.userId(), request.answerText(), githubProfile);
        events.publish("intensive.stage_submitted", Map.of(
                "intensiveId", intensiveId.toString(),
                "stageId", stageId.toString(),
                "userId", request.userId().toString()
        ));
        return latestSubmission(taskId, request.userId());
    }

    private void createStages(UUID intensiveId, String startsAt, String endsAt, List<IntensiveStageSaveRequest> requestedStages) {
        var start = OffsetDateTime.parse(startsAt);
        var requestedEnd = OffsetDateTime.parse(endsAt);
        var defaults = List.of(
                new IntensiveStageSaveRequest("Вводный этап", "Материалы, диагностика и первое задание.", "Подготовить профиль и рабочий репозиторий", "Укажите GitHub-профиль, подготовьте рабочий репозиторий, README, план решения и базовую структуру проекта.", null, null),
                new IntensiveStageSaveRequest("Основной практический этап", "Ключевая практика, дедлайны и обратная связь.", "Реализовать основную функциональность", "Разработать бизнес-логику, API, интерфейс или другой основной результат интенсива.", null, null),
                new IntensiveStageSaveRequest("Финальный этап", "Итоговое задание, рейтинг и результаты.", "Финализировать проект", "Довести проект до состояния сдачи: документация, запуск, проверочный сценарий и итоговый репозиторий.", null, null)
        );
        var stages = normalizeThreeStages(requestedStages, defaults);
        for (var index = 0; index < stages.size(); index++) {
            var stage = stages.get(index);
            // Use explicitly provided stage dates when present; fall back to auto-distribution.
            OffsetDateTime stageStart;
            OffsetDateTime stageEnd;
            if (stage.startsAt() != null && !stage.startsAt().isBlank()) {
                stageStart = OffsetDateTime.parse(stage.startsAt());
            } else {
                stageStart = start.plus(Duration.ofHours(24L * index));
            }
            if (stage.endsAt() != null && !stage.endsAt().isBlank()) {
                stageEnd = OffsetDateTime.parse(stage.endsAt());
            } else {
                var defaultEnd = stageStart.plus(Duration.ofHours(24));
                stageEnd = index == stages.size() - 1 && requestedEnd.isAfter(stageStart) ? requestedEnd : defaultEnd;
            }
            insertStageWithTask(intensiveId, stage, index + 1, stageStart, stageEnd);
        }
    }

    private List<IntensiveStageSaveRequest> normalizeThreeStages(List<IntensiveStageSaveRequest> requestedStages, List<IntensiveStageSaveRequest> defaults) {
        if (requestedStages == null || requestedStages.isEmpty()) {
            return defaults;
        }
        if (requestedStages.size() > 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Интенсив всегда состоит ровно из трех этапов");
        }
        if (requestedStages.size() == 3) {
            return requestedStages;
        }
        var normalized = new java.util.ArrayList<>(requestedStages);
        for (var index = requestedStages.size(); index < 3; index++) {
            normalized.add(defaults.get(index));
        }
        return normalized;
    }

    private void insertStageWithTask(UUID intensiveId, IntensiveStageSaveRequest stage, int position, OffsetDateTime startsAt, OffsetDateTime endsAt) {
        var stageId = UUID.randomUUID();
        var taskTitle = blankOr(stage.taskTitle(), "Задание этапа " + position);
        var taskDescription = blankOr(stage.taskDescription(), "Выполните задание этапа. GitHub-профиль уже привязан к заявке участника.");
        jdbc.update("""
                        INSERT INTO learning.intensive_stages (id, intensive_id, title, description, task_title, task_description, answer_type, position, starts_at, ends_at)
                        VALUES (?, ?, ?, ?, ?, ?, 'GITHUB_REPOSITORY', ?, ?, ?)
                        """,
                stageId, intensiveId, blankOr(stage.title(), "Этап " + position), blankOr(stage.description(), taskDescription),
                taskTitle, taskDescription, position, startsAt, endsAt);
        jdbc.update("""
                        INSERT INTO learning.tasks (id, intensive_id, intensive_stage_id, title, description, deadline_at, max_score)
                        VALUES (?, ?, ?, ?, ?, ?, 100)
                        """, UUID.randomUUID(), intensiveId, stageId, taskTitle, taskDescription, endsAt);
    }

    private boolean isActiveManager(UUID intensiveId, UUID managerUserId) {
        var count = jdbc.queryForObject("""
                SELECT count(*)
                FROM learning.intensive_managers
                WHERE intensive_id = ? AND user_id = ? AND status = 'ACTIVE'
                """, Integer.class, intensiveId, managerUserId);
        return count != null && count > 0;
    }

    private boolean hasApplication(UUID intensiveId, UUID userId) {
        var count = jdbc.queryForObject("""
                SELECT count(*)
                FROM learning.intensive_applications
                WHERE intensive_id = ? AND user_id = ? AND status IN ('PENDING', 'APPROVED')
                """, Integer.class, intensiveId, userId);
        return count != null && count > 0;
    }

    private boolean hasParticipant(UUID intensiveId, UUID userId) {
        var count = jdbc.queryForObject("""
                SELECT count(*)
                FROM learning.intensive_participants
                WHERE intensive_id = ? AND user_id = ?
                """, Integer.class, intensiveId, userId);
        return count != null && count > 0;
    }

    private boolean hasParticipantStatus(UUID intensiveId, UUID userId, String status) {
        var count = jdbc.queryForObject("""
                SELECT count(*)
                FROM learning.intensive_participants
                WHERE intensive_id = ? AND user_id = ? AND status = ?
                """, Integer.class, intensiveId, userId, status);
        return count != null && count > 0;
    }

    private ParticipantDto findParticipantByUser(UUID intensiveId, UUID userId) {
        var rows = jdbc.query("""
                SELECT p.id, p.intensive_id, p.user_id, p.organization_id, p.github_url, p.score, p.status,
                       u.email, u.full_name
                FROM learning.intensive_participants p
                LEFT JOIN identity.users u ON u.id = p.user_id
                WHERE p.intensive_id = ? AND p.user_id = ?
                """, (rs, rowNum) -> new ParticipantDto(
                rs.getObject("id", UUID.class),
                rs.getObject("intensive_id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getString("github_url"),
                rs.getInt("score"),
                rs.getString("status"),
                rs.getString("email"),
                rs.getString("full_name")
        ), intensiveId, userId);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Enroll in the intensive before submitting stages");
        }
        return rows.get(0);
    }

    private Instant stageStartsAt(UUID intensiveId, UUID stageId) {
        var rows = jdbc.query("""
                SELECT starts_at
                FROM learning.intensive_stages
                WHERE id = ? AND intensive_id = ?
                """, (rs, rowNum) -> rs.getTimestamp("starts_at").toInstant(), stageId, intensiveId);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Stage not found");
        }
        return rows.get(0);
    }

    private ParticipantDto findParticipant(UUID intensiveId, UUID participantId) {
        var rows = jdbc.query("""
                SELECT p.id, p.intensive_id, p.user_id, p.organization_id, p.github_url, p.score, p.status,
                       u.email, u.full_name
                FROM learning.intensive_participants p
                LEFT JOIN identity.users u ON u.id = p.user_id
                WHERE p.id = ? AND p.intensive_id = ?
                """, (rs, rowNum) -> new ParticipantDto(
                rs.getObject("id", UUID.class),
                rs.getObject("intensive_id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getString("github_url"),
                rs.getInt("score"),
                rs.getString("status"),
                rs.getString("email"),
                rs.getString("full_name")
        ), participantId, intensiveId);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found");
        }
        return rows.get(0);
    }

    private UUID taskForStage(UUID intensiveId, UUID stageId) {
        var rows = jdbc.query("""
                SELECT id
                FROM learning.tasks
                WHERE intensive_id = ? AND intensive_stage_id = ?
                LIMIT 1
                """, (rs, rowNum) -> rs.getObject("id", UUID.class), intensiveId, stageId);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Stage task not found");
        }
        return rows.get(0);
    }

    private IntensiveSubmissionDto latestSubmission(UUID taskId, UUID userId) {
        var rows = jdbc.query("""
                SELECT s.id, s.task_id, s.user_id, s.github_url, s.answer_text, s.status, s.score, s.submitted_at,
                       st.title AS stage_title, u.email, u.full_name, s.reviewer_comment
                FROM learning.task_submissions s
                JOIN learning.tasks t ON t.id = s.task_id
                LEFT JOIN learning.intensive_stages st ON st.id = t.intensive_stage_id
                LEFT JOIN identity.users u ON u.id = s.user_id
                WHERE s.task_id = ? AND s.user_id = ?
                ORDER BY s.submitted_at DESC
                LIMIT 1
                """, (rs, rowNum) -> new IntensiveSubmissionDto(
                rs.getObject("id", UUID.class),
                rs.getObject("task_id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getString("github_url"),
                rs.getString("answer_text"),
                rs.getString("status"),
                rs.getObject("score", Integer.class),
                rs.getTimestamp("submitted_at").toInstant(),
                rs.getString("stage_title"),
                rs.getString("email"),
                rs.getString("full_name"),
                rs.getString("reviewer_comment")
        ), taskId, userId);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found");
        }
        return rows.get(0);
    }

    private String blankOr(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String normalizeGithubProfile(String value) {
        var trimmed = value.trim();
        var withoutProtocol = trimmed
                .replaceFirst("^https?://", "")
                .replaceFirst("^www\\.", "");
        if (withoutProtocol.startsWith("github.com/")) {
            var tail = withoutProtocol.substring("github.com/".length());
            var user = tail.split("[/?#]")[0];
            return user.isBlank() ? trimmed : "https://github.com/" + user;
        }
        var username = withoutProtocol.replaceFirst("^@", "").split("[/?#]")[0];
        return username.isBlank() ? trimmed : "https://github.com/" + username;
    }

    private String normalizeIntensiveStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Intensive status is required");
        }
        return switch (status) {
            case "DRAFT", "ENROLLMENT_OPEN", "ENROLLMENT_CLOSED", "IN_PROGRESS", "COMPLETED", "HIDDEN" -> status;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported intensive status");
        };
    }

    private List<UUID> managerUserIds(IntensiveCreateRequest request) {
        var ids = new LinkedHashSet<UUID>();
        if (request.creatorUserId() != null) {
            ids.add(request.creatorUserId());
        }
        if (request.managerUserIds() != null) {
            ids.addAll(request.managerUserIds());
        }
        return ids.stream().toList();
    }

    private ApplicationDto findApplication(UUID applicationId) {
        var rows = jdbc.query("""
                SELECT a.id, a.intensive_id, a.user_id, a.organization_id, a.github_url, a.status,
                       u.email, u.full_name
                FROM learning.intensive_applications a
                LEFT JOIN identity.users u ON u.id = a.user_id
                WHERE a.id = ?
                """, (rs, rowNum) -> new ApplicationDto(
                rs.getObject("id", UUID.class),
                rs.getObject("intensive_id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getString("github_url"),
                rs.getString("status"),
                rs.getString("email"),
                rs.getString("full_name")
        ), applicationId);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found");
        }
        return rows.get(0);
    }

    private boolean isOrganizerManager(UUID intensiveId, UUID userId) {
        var count = jdbc.queryForObject("""
                SELECT count(*)
                FROM learning.intensives i
                LEFT JOIN organization.organization_members m
                  ON m.organization_id = i.organization_id
                 AND m.user_id = ?
                 AND m.status = 'ACTIVE'
                 AND m.role IN ('OWNER', 'COMPANY_MANAGER', 'PARTNER_MANAGER')
                LEFT JOIN identity.users u
                  ON u.id = ?
                 AND u.role = 'ADMIN'
                WHERE i.id = ?
                  AND (m.id IS NOT NULL OR u.id IS NOT NULL)
                """, Integer.class, userId, userId, intensiveId);
        return count != null && count > 0;
    }

    private IntensiveDto findIntensive(UUID id) {
        var rows = jdbc.query("""
                SELECT id, title, description, organizer_type, organization_id, status, starts_at, ends_at,
                       registration_deadline, cover_url, participant_limit, created_at
                FROM learning.intensives
                WHERE id = ?
                """, (rs, rowNum) -> mapIntensive(rs), id);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Intensive not found");
        }
        return rows.get(0);
    }

    private IntensiveDto mapIntensive(ResultSet rs) throws SQLException {
        var regDeadlineTs = rs.getTimestamp("registration_deadline");
        return new IntensiveDto(
                rs.getObject("id", UUID.class),
                rs.getString("title"),
                rs.getString("description"),
                rs.getString("organizer_type"),
                rs.getObject("organization_id", UUID.class),
                rs.getString("status"),
                rs.getTimestamp("starts_at").toInstant(),
                rs.getTimestamp("ends_at").toInstant(),
                regDeadlineTs != null ? regDeadlineTs.toInstant() : null,
                rs.getString("cover_url"),
                rs.getInt("participant_limit"),
                rs.getTimestamp("created_at").toInstant()
        );
    }

    private OffsetDateTime parseOptionalDateTime(String value, String fallback) {
        return (value != null && !value.isBlank()) ? OffsetDateTime.parse(value) : OffsetDateTime.parse(fallback);
    }

    private IntensiveManagerDto mapManager(ResultSet rs) throws SQLException {
        return new IntensiveManagerDto(
                rs.getObject("id", UUID.class),
                rs.getObject("intensive_id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getString("role"),
                rs.getString("status")
        );
    }
}
