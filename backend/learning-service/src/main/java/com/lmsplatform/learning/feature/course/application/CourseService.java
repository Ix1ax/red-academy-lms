package com.lmsplatform.learning.feature.course.application;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lmsplatform.learning.feature.course.domain.*;
import com.lmsplatform.learning.shared.messaging.EventPublisher;
import com.lmsplatform.learning.shared.storage.JsonDocumentStorage;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CourseService {
    private final JdbcTemplate jdbc;
    private final EventPublisher events;
    private final JsonDocumentStorage storage;
    private final ObjectMapper objectMapper;

    public CourseService(JdbcTemplate jdbc, EventPublisher events, JsonDocumentStorage storage, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.events = events;
        this.storage = storage;
        this.objectMapper = objectMapper;
    }

    public List<CourseDto> list(String status, UUID organizationId) {
        var effectiveStatus = status == null || status.isBlank() ? "PUBLISHED" : status;
        var allStatuses = "ALL".equalsIgnoreCase(effectiveStatus);
        if (organizationId == null) {
            if (allStatuses) {
                // Admin context: return ALL courses across all types and statuses
                return jdbc.query("""
                        SELECT id, title, description, author_type, course_type, organization_id, level, duration_hours, status, cover_url, created_at, has_certificate
                        FROM learning.courses
                        ORDER BY created_at DESC
                        """, (rs, rowNum) -> mapCourse(rs));
            }
            return jdbc.query("""
                    SELECT id, title, description, author_type, course_type, organization_id, level, duration_hours, status, cover_url, created_at, has_certificate
                    FROM learning.courses
                    WHERE status = ? AND course_type = 'PUBLIC'
                    ORDER BY created_at DESC
                    """, (rs, rowNum) -> mapCourse(rs), effectiveStatus);
        }
        if (allStatuses) {
            return jdbc.query("""
                    SELECT id, title, description, author_type, course_type, organization_id, level, duration_hours, status, cover_url, created_at, has_certificate
                    FROM learning.courses
                    WHERE course_type = 'PUBLIC' OR (course_type = 'COMPANY' AND organization_id = ?)
                    ORDER BY created_at DESC
                    """, (rs, rowNum) -> mapCourse(rs), organizationId);
        }
        return jdbc.query("""
                SELECT id, title, description, author_type, course_type, organization_id, level, duration_hours, status, cover_url, created_at, has_certificate
                FROM learning.courses
                WHERE status = ?
                  AND (course_type = 'PUBLIC' OR (course_type = 'COMPANY' AND organization_id = ?))
                ORDER BY created_at DESC
                """, (rs, rowNum) -> mapCourse(rs), effectiveStatus, organizationId);
    }

    public CourseDto create(CourseCreateRequest request) {
        var id = UUID.randomUUID();
        var courseType = normalizeCourseType(request.courseType());
        if ("COMPANY".equals(courseType) && request.organizationId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Company course requires organizationId");
        }
        var status = "MAIN_COMPANY".equals(request.authorType()) ? "PUBLISHED" : "DRAFT";
        jdbc.update("""
                        INSERT INTO learning.courses (id, title, description, author_type, course_type, organization_id, level, duration_hours, status, cover_url, content_object_key, has_certificate)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                id, request.title(), request.description(), request.authorType(), courseType, request.organizationId(),
                request.level(), request.durationHours(), status, request.coverUrl(), courseContentKey(id), request.hasCertificate());
        storage.put(courseContentKey(id), defaultCourseContent(id));
        events.publish("course.created", Map.of("courseId", id.toString()));
        return findCourse(id);
    }

    public CourseDto update(UUID id, CourseCreateRequest request) {
        findCourse(id);
        var courseType = normalizeCourseType(request.courseType());
        if ("COMPANY".equals(courseType) && request.organizationId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Company course requires organizationId");
        }
        jdbc.update("""
                        UPDATE learning.courses
                        SET title = ?,
                            description = ?,
                            author_type = ?,
                            course_type = ?,
                            organization_id = ?,
                            level = ?,
                            duration_hours = ?,
                            cover_url = ?,
                            has_certificate = ?,
                            updated_at = now()
                        WHERE id = ?
                        """,
                request.title(), request.description(), request.authorType(), courseType, request.organizationId(),
                request.level(), request.durationHours(), request.coverUrl(), request.hasCertificate(), id);
        events.publish("course.updated", Map.of("courseId", id.toString()));
        return findCourse(id);
    }

    public CourseDto updateStatus(UUID id, String status) {
        findCourse(id);
        var normalized = normalizeCourseStatus(status);
        jdbc.update("UPDATE learning.courses SET status = ?, updated_at = now() WHERE id = ?", normalized, id);
        events.publish("course.status_changed", Map.of("courseId", id.toString(), "status", normalized));
        return findCourse(id);
    }

    public void delete(UUID id) {
        findCourse(id);
        jdbc.update("DELETE FROM learning.courses WHERE id = ?", id);
        events.publish("course.deleted", Map.of("courseId", id.toString()));
    }

    public CourseDetailsDto get(UUID id) {
        var course = findCourse(id);
        var lessons = jdbc.query("""
                SELECT id, course_id, parent_id, item_type, title, content, test_schema, estimated_minutes, position
                FROM learning.lessons
                WHERE course_id = ?
                ORDER BY position ASC
                """, (rs, rowNum) -> mapLesson(rs), id);
        return new CourseDetailsDto(course, lessons);
    }

    public CourseContentDto getContent(UUID courseId) {
        findCourse(courseId);
        var content = storage.get(courseContentKey(courseId), CourseContentDto.class);
        if (content == null) {
            // S3 object not found — build content from DB lessons (handles seeded courses)
            content = buildContentFromDb(courseId);
            storage.put(courseContentKey(courseId), content);
        }
        return content;
    }

    private CourseContentDto buildContentFromDb(UUID courseId) {
        var lessons = jdbc.query("""
                SELECT id, course_id, parent_id, item_type, title, content, test_schema, estimated_minutes, position
                FROM learning.lessons
                WHERE course_id = ?
                ORDER BY position ASC
                """, (rs, rowNum) -> mapLesson(rs), courseId);
        if (lessons.isEmpty()) {
            return defaultCourseContent(courseId);
        }
        var nodes = lessons.stream()
                .map(l -> new CourseContentNodeDto(
                        l.id(),
                        l.parentId(),
                        l.type(),
                        l.title(),
                        l.htmlContent(),
                        l.testSchema(),
                        l.estimatedMinutes(),
                        l.position()
                ))
                .toList();
        return new CourseContentDto(courseId, "1.0", Instant.now(), nodes);
    }

    public CourseContentDto saveContent(UUID courseId, CourseContentSaveRequest request) {
        findCourse(courseId);
        var normalized = new ArrayList<CourseContentNodeDto>();
        for (var item : request.items()) {
            normalized.add(new CourseContentNodeDto(
                    item.id() == null ? UUID.randomUUID() : item.id(),
                    item.parentId(),
                    normalizeCourseItemType(item.type()),
                    item.title(),
                    item.htmlContent(),
                    item.testSchema(),
                    item.estimatedMinutes() == null ? 15 : item.estimatedMinutes(),
                    item.position()
            ));
        }
        var content = new CourseContentDto(courseId, "1.0", Instant.now(), normalized);
        storage.put(courseContentKey(courseId), content);
        persistContentItems(courseId, normalized);
        jdbc.update("UPDATE learning.courses SET content_object_key = ?, updated_at = now() WHERE id = ?", courseContentKey(courseId), courseId);
        events.publish("course.content_saved", Map.of("courseId", courseId.toString()));
        return content;
    }

    public CourseDto sendToModeration(UUID id) {
        jdbc.update("UPDATE learning.courses SET status = 'MODERATION', updated_at = now() WHERE id = ?", id);
        events.publish("course.sent_to_moderation", Map.of("courseId", id.toString()));
        return findCourse(id);
    }

    public CourseDto publishCourse(UUID id) {
        jdbc.update("UPDATE learning.courses SET status = 'PUBLISHED', updated_at = now() WHERE id = ?", id);
        events.publish("course.published", Map.of("courseId", id.toString()));
        return findCourse(id);
    }

    public LessonDto addLesson(UUID courseId, LessonCreateRequest request) {
        var content = getContent(courseId);
        var item = new CourseContentNodeDto(
                UUID.randomUUID(),
                request.parentId(),
                normalizeCourseItemType(request.type()),
                request.title(),
                request.htmlContent() == null ? request.content() : request.htmlContent(),
                request.testSchema(),
                request.estimatedMinutes() == null ? 15 : request.estimatedMinutes(),
                request.position()
        );
        var items = new ArrayList<>(content.items());
        items.add(item);
        saveContent(courseId, new CourseContentSaveRequest(items));

        var lessonId = UUID.randomUUID();
        jdbc.update("""
                        INSERT INTO learning.lessons (id, course_id, parent_id, item_type, title, content, test_schema, estimated_minutes, position)
                        VALUES (?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?)
                        """, lessonId, courseId, request.parentId(), normalizeCourseItemType(request.type()),
                request.title(), request.htmlContent() == null ? request.content() : request.htmlContent(), request.testSchema() == null ? null : request.testSchema().toString(),
                request.estimatedMinutes() == null ? 15 : request.estimatedMinutes(), request.position());
        return new LessonDto(lessonId, courseId, request.parentId(), normalizeCourseItemType(request.type()), request.title(),
                request.content(), request.htmlContent(), request.testSchema(), request.estimatedMinutes() == null ? 15 : request.estimatedMinutes(), request.position());
    }

    public EnrollmentDto enroll(UUID courseId, EnrollmentRequest request) {
        ensureCourseIsAvailableForOrganization(courseId, request.organizationId());
        var enrollmentId = UUID.randomUUID();
        jdbc.update("""
                        INSERT INTO learning.enrollments (id, user_id, course_id, progress, status)
                        VALUES (?, ?, ?, 0, 'ACTIVE')
                        ON CONFLICT (user_id, course_id)
                        DO UPDATE SET status = CASE
                                           WHEN learning.enrollments.status = 'COMPLETED' THEN 'COMPLETED'
                                           ELSE 'ACTIVE'
                                       END,
                                      updated_at = now()
                        """, enrollmentId, request.userId(), courseId);
        events.publish("course.enrollment_created", Map.of("courseId", courseId.toString(), "userId", request.userId().toString()));
        return getEnrollment(courseId, request.userId());
    }

    public EnrollmentDto updateProgress(UUID courseId, ProgressRequest request) {
        ensureCourseIsAvailableForOrganization(courseId, request.organizationId());
        jdbc.update("""
                UPDATE learning.enrollments
                SET progress = ?, status = CASE WHEN ? >= 100 THEN 'COMPLETED' ELSE status END, updated_at = now()
                WHERE user_id = ? AND course_id = ?
                """, request.progress(), request.progress(), request.userId(), courseId);
        if (request.progress() >= 100) {
            issueCourseCertificate(courseId, request.userId());
            events.publish("course.completed", Map.of("courseId", courseId.toString(), "userId", request.userId().toString()));
        }
        return new EnrollmentDto(null, request.userId(), courseId, request.progress(), request.progress() >= 100 ? "COMPLETED" : "ACTIVE");
    }

    public LessonProgressDto completeLesson(UUID courseId, UUID lessonId, LessonProgressRequest request) {
        ensureCourseIsAvailableForOrganization(courseId, request.organizationId());
        var enrollment = getEnrollment(courseId, request.userId());
        if ("COMPLETED".equals(enrollment.status())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Course is already completed");
        }
        var lesson = findLesson(courseId, lessonId);
        if ("FOLDER".equals(lesson.type())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Module folders cannot be completed directly");
        }
        if (isLessonCompleted(lessonId, request.userId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lesson is already completed");
        }
        var score = "TEST".equals(lesson.type()) ? gradeTest(lesson.testSchema(), request.answerJson()) : 100;
        var status = score >= 70 ? "COMPLETED" : "NEEDS_RETRY";
        jdbc.update("""
                        INSERT INTO learning.lesson_progress (id, user_id, course_id, lesson_id, status, score, answer_json, completed_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?::jsonb, now())
                        ON CONFLICT (user_id, lesson_id)
                        DO UPDATE SET status = EXCLUDED.status,
                                      score = EXCLUDED.score,
                                      answer_json = EXCLUDED.answer_json,
                                      completed_at = EXCLUDED.completed_at
                        """,
                UUID.randomUUID(), request.userId(), courseId, lessonId, status, score,
                request.answerJson() == null ? null : request.answerJson().toString());
        var courseProgress = recalculateProgress(courseId, request.userId());
        events.publish("course.lesson_completed", Map.of(
                "courseId", courseId.toString(),
                "lessonId", lessonId.toString(),
                "userId", request.userId().toString(),
                "status", status
        ));
        return new LessonProgressDto(lessonId, request.userId(), courseId, status, score, courseProgress);
    }

    public CourseProgressDto progress(UUID courseId, UUID userId, UUID organizationId) {
        var course = findCourse(courseId);
        // Corporate students accessing their company's COMPANY course → auto-enroll
        if ("COMPANY".equals(course.courseType())
                && organizationId != null
                && organizationId.equals(course.organizationId())) {
            autoEnrollIfAbsent(courseId, userId, organizationId);
        } else {
            ensureCourseIsAvailableForOrganization(courseId, organizationId);
        }
        var rows = jdbc.query("""
                SELECT id, user_id, course_id, progress, status
                FROM learning.enrollments
                WHERE course_id = ? AND user_id = ?
                """, (rs, rowNum) -> new EnrollmentDto(
                rs.getObject("id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getObject("course_id", UUID.class),
                rs.getInt("progress"),
                rs.getString("status")
        ), courseId, userId);
        var lessonRows = jdbc.query("""
                SELECT lesson_id, user_id, course_id, status, score, 0 AS course_progress
                FROM learning.lesson_progress
                WHERE course_id = ? AND user_id = ?
                """, (rs, rowNum) -> new LessonProgressDto(
                rs.getObject("lesson_id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getObject("course_id", UUID.class),
                rs.getString("status"),
                rs.getInt("score"),
                rs.getInt("course_progress")
        ), courseId, userId);
        if (rows.isEmpty()) {
            return new CourseProgressDto(userId, courseId, 0, "NOT_ENROLLED", lessonRows);
        }
        var enrollment = rows.get(0);
        return new CourseProgressDto(userId, courseId, enrollment.progress(), enrollment.status(), lessonRows);
    }

    private void autoEnrollIfAbsent(UUID courseId, UUID userId, UUID organizationId) {
        var existing = count("""
                SELECT count(*) FROM learning.enrollments
                WHERE course_id = ? AND user_id = ?
                """, courseId, userId);
        if (existing == 0) {
            jdbc.update("""
                    INSERT INTO learning.enrollments (id, user_id, course_id, progress, status)
                    VALUES (?, ?, ?, 0, 'ACTIVE')
                    ON CONFLICT (user_id, course_id) DO NOTHING
                    """, UUID.randomUUID(), userId, courseId);
            events.publish("course.auto_enrolled", Map.of(
                    "courseId", courseId.toString(),
                    "userId", userId.toString(),
                    "organizationId", organizationId.toString()
            ));
        }
    }

    private EnrollmentDto getEnrollment(UUID courseId, UUID userId) {
        var rows = jdbc.query("""
                SELECT id, user_id, course_id, progress, status
                FROM learning.enrollments
                WHERE course_id = ? AND user_id = ?
                """, (rs, rowNum) -> new EnrollmentDto(
                rs.getObject("id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getObject("course_id", UUID.class),
                rs.getInt("progress"),
                rs.getString("status")
        ), courseId, userId);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Enroll in the course before passing lessons");
        }
        return rows.get(0);
    }

    private boolean isLessonCompleted(UUID lessonId, UUID userId) {
        return count("""
                SELECT count(*)
                FROM learning.lesson_progress
                WHERE lesson_id = ? AND user_id = ? AND status = 'COMPLETED'
                """, lessonId, userId) > 0;
    }

    private int recalculateProgress(UUID courseId, UUID userId) {
        var total = count("""
                SELECT count(*)
                FROM learning.lessons
                WHERE course_id = ? AND item_type <> 'FOLDER'
                """, courseId);
        if (total == 0) {
            return 0;
        }
        var completed = count("""
                SELECT count(*)
                FROM learning.lesson_progress
                WHERE course_id = ? AND user_id = ? AND status = 'COMPLETED'
                """, courseId, userId);
        var progress = Math.min(100, Math.round((completed * 100.0f) / total));
        jdbc.update("""
                UPDATE learning.enrollments
                SET progress = ?, status = CASE WHEN ? >= 100 THEN 'COMPLETED' ELSE 'ACTIVE' END, updated_at = now()
                WHERE user_id = ? AND course_id = ?
                """, progress, progress, userId, courseId);
        if (progress >= 100) {
            issueCourseCertificate(courseId, userId);
            events.publish("course.completed", Map.of("courseId", courseId.toString(), "userId", userId.toString()));
        }
        return progress;
    }

    private int gradeTest(JsonNode schema, JsonNode answerJson) {
        if (schema == null || !schema.has("questions") || !schema.get("questions").isArray()) {
            return 100;
        }
        var questions = schema.get("questions");
        if (questions.size() == 0) {
            return 100;
        }
        var correct = 0;
        for (var i = 0; i < questions.size(); i++) {
            var question = questions.get(i);
            if (sameAnswer(question.get("answer"), answerAt(answerJson, i))) {
                correct++;
            }
        }
        return Math.round((correct * 100.0f) / questions.size());
    }

    private JsonNode answerAt(JsonNode answerJson, int index) {
        if (answerJson == null) {
            return null;
        }
        if (answerJson.has("answers") && answerJson.get("answers").isArray() && answerJson.get("answers").size() > index) {
            var item = answerJson.get("answers").get(index);
            return item.has("value") ? item.get("value") : item;
        }
        return answerJson.get(String.valueOf(index));
    }

    private boolean sameAnswer(JsonNode expected, JsonNode actual) {
        if (expected == null || actual == null) {
            return false;
        }
        if (expected.isArray()) {
            if (actual.isArray()) {
                if (expected.size() != actual.size()) {
                    return false;
                }
                for (var answer : expected) {
                    if (!containsText(actual, answer.asText())) {
                        return false;
                    }
                }
                return true;
            }
            return expected.size() == 1 && expected.get(0).asText().equalsIgnoreCase(actual.asText());
        }
        return expected.asText().equalsIgnoreCase(actual.asText());
    }

    private boolean containsText(JsonNode array, String value) {
        for (var item : array) {
            if (item.asText().equalsIgnoreCase(value)) {
                return true;
            }
        }
        return false;
    }

    private int count(String sql, Object... args) {
        var result = jdbc.queryForObject(sql, Integer.class, args);
        return result == null ? 0 : result;
    }

    private void issueCourseCertificate(UUID courseId, UUID userId) {
        var course = findCourse(courseId);
        if (!course.hasCertificate()) {
            return; // Course does not issue certificates
        }
        var existing = jdbc.queryForObject("""
                SELECT count(*)
                FROM learning.certificates
                WHERE user_id = ? AND course_id = ?
                """, Integer.class, userId, courseId);
        if (existing != null && existing > 0) {
            return;
        }
        jdbc.update("""
                INSERT INTO learning.certificates (id, user_id, course_id, title)
                VALUES (?, ?, ?, ?)
                """, UUID.randomUUID(), userId, courseId, "Сертификат: " + course.title());
        events.publish("certificate.issued", Map.of("courseId", courseId.toString(), "userId", userId.toString()));
    }

    private CourseDto findCourse(UUID id) {
        var rows = jdbc.query("""
                SELECT id, title, description, author_type, course_type, organization_id, level, duration_hours, status, cover_url, created_at, has_certificate
                FROM learning.courses
                WHERE id = ?
                """, (rs, rowNum) -> mapCourse(rs), id);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }
        return rows.get(0);
    }

    private LessonDto findLesson(UUID courseId, UUID lessonId) {
        var rows = jdbc.query("""
                SELECT id, course_id, parent_id, item_type, title, content, test_schema, estimated_minutes, position
                FROM learning.lessons
                WHERE course_id = ? AND id = ?
                """, (rs, rowNum) -> mapLesson(rs), courseId, lessonId);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found");
        }
        return rows.get(0);
    }

    private void persistContentItems(UUID courseId, List<CourseContentNodeDto> items) {
        jdbc.update("DELETE FROM learning.lessons WHERE course_id = ?", courseId);
        items.stream()
                .filter(item -> item.parentId() == null)
                .forEach(item -> insertContentItem(courseId, item));
        items.stream()
                .filter(item -> item.parentId() != null)
                .forEach(item -> insertContentItem(courseId, item));
    }

    private void insertContentItem(UUID courseId, CourseContentNodeDto item) {
        jdbc.update("""
                        INSERT INTO learning.lessons (id, course_id, parent_id, item_type, title, content, test_schema, estimated_minutes, position)
                        VALUES (?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?)
                        """,
                item.id(), courseId, item.parentId(), normalizeCourseItemType(item.type()), item.title(), item.htmlContent(),
                item.testSchema() == null ? null : item.testSchema().toString(),
                item.estimatedMinutes() == null ? 15 : item.estimatedMinutes(), item.position());
    }

    private CourseContentDto defaultCourseContent(UUID courseId) {
        var folderId = UUID.randomUUID();
        return new CourseContentDto(courseId, "1.0", Instant.now(), List.of(
                new CourseContentNodeDto(folderId, null, "FOLDER", "Модуль 1. Старт курса", null, null, 5, 1),
                new CourseContentNodeDto(UUID.randomUUID(), folderId, "LONGREAD", "Лонгрид: введение",
                        "<h2>Введение</h2><p>Здесь можно писать HTML-разметкой: текст, списки, ссылки, изображения и примеры кода.</p>",
                        null, 20, 1),
                new CourseContentNodeDto(UUID.randomUUID(), folderId, "TEST", "Тест: проверка понимания",
                        null, null, 10, 2)
        ));
    }

    private String courseContentKey(UUID courseId) {
        return "courses/" + courseId + "/content.json";
    }

    private String normalizeCourseItemType(String type) {
        if (type == null || type.isBlank()) {
            return "LONGREAD";
        }
        return switch (type) {
            case "FOLDER", "LONGREAD", "TEST" -> type;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported course item type");
        };
    }

    private String normalizeCourseType(String type) {
        if (type == null || type.isBlank()) {
            return "PUBLIC";
        }
        return switch (type) {
            case "PUBLIC", "COMPANY" -> type;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported course type");
        };
    }

    private String normalizeCourseStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course status is required");
        }
        return switch (status) {
            case "DRAFT", "MODERATION", "PUBLISHED", "HIDDEN" -> status;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported course status");
        };
    }

    private void ensureCourseIsAvailableForOrganization(UUID courseId, UUID organizationId) {
        var course = findCourse(courseId);
        if (!"PUBLISHED".equals(course.status())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Course is not published");
        }
        if ("PUBLIC".equals(course.courseType())) {
            return;
        }
        if (organizationId == null || !organizationId.equals(course.organizationId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Company course is available only to users of its company");
        }
    }

    private CourseDto mapCourse(ResultSet rs) throws SQLException {
        return new CourseDto(
                rs.getObject("id", UUID.class),
                rs.getString("title"),
                rs.getString("description"),
                rs.getString("author_type"),
                rs.getString("course_type"),
                rs.getObject("organization_id", UUID.class),
                rs.getString("level"),
                rs.getInt("duration_hours"),
                rs.getString("status"),
                rs.getString("cover_url"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getBoolean("has_certificate")
        );
    }

    private LessonDto mapLesson(ResultSet rs) throws SQLException {
        var schema = rs.getString("test_schema");
        JsonNode testSchema = null;
        if (schema != null && !schema.isBlank()) {
            try {
                testSchema = objectMapper.readTree(schema);
            } catch (Exception ex) {
                throw new SQLException("Cannot parse test schema", ex);
            }
        }
        var content = rs.getString("content");
        return new LessonDto(
                rs.getObject("id", UUID.class),
                rs.getObject("course_id", UUID.class),
                rs.getObject("parent_id", UUID.class),
                rs.getString("item_type"),
                rs.getString("title"),
                content,
                content,
                testSchema,
                rs.getInt("estimated_minutes"),
                rs.getInt("position")
        );
    }
}
