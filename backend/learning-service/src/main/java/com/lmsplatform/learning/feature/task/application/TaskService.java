package com.lmsplatform.learning.feature.task.application;

import com.lmsplatform.learning.feature.task.domain.*;
import com.lmsplatform.learning.shared.messaging.EventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class TaskService {
    private final JdbcTemplate jdbc;
    private final EventPublisher events;

    public TaskService(JdbcTemplate jdbc, EventPublisher events) {
        this.jdbc = jdbc;
        this.events = events;
    }

    public TaskDto create(TaskCreateRequest request) {
        var id = UUID.randomUUID();
        jdbc.update("""
                        INSERT INTO learning.tasks (id, course_id, intensive_id, title, description, deadline_at, max_score)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, id, request.courseId(), request.intensiveId(), request.title(), request.description(),
                request.deadlineAt() == null ? null : OffsetDateTime.parse(request.deadlineAt()), request.maxScore());
        return new TaskDto(id, request.courseId(), request.intensiveId(), request.title(), request.description(), request.maxScore());
    }

    public SubmissionDto submit(UUID taskId, SubmissionRequest request) {
        var id = UUID.randomUUID();
        jdbc.update("""
                        INSERT INTO learning.task_submissions (id, task_id, user_id, file_id, answer_text, status)
                        VALUES (?, ?, ?, ?, ?, 'SUBMITTED')
                        """, id, taskId, request.userId(), request.fileId(), request.answerText());
        events.publish("task.submitted", Map.of("taskId", taskId.toString(), "userId", request.userId().toString()));
        return new SubmissionDto(id, taskId, request.userId(), request.fileId(), request.answerText(), null, "SUBMITTED", null);
    }

    public SubmissionDto review(UUID submissionId, ReviewRequest request) {
        jdbc.update("""
                UPDATE learning.task_submissions
                SET score = ?, status = 'REVIEWED', reviewer_comment = ?, reviewed_at = now()
                WHERE id = ?
                """, request.score(), request.comment(), submissionId);
        var rows = jdbc.query("""
                SELECT id, task_id, user_id, file_id, answer_text, score, status, reviewer_comment
                FROM learning.task_submissions
                WHERE id = ?
                """, (rs, rowNum) -> new SubmissionDto(
                rs.getObject("id", UUID.class),
                rs.getObject("task_id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getObject("file_id", UUID.class),
                rs.getString("answer_text"),
                (Integer) rs.getObject("score"),
                rs.getString("status"),
                rs.getString("reviewer_comment")
        ), submissionId);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found");
        }
        var reviewed = rows.get(0);
        recalculateIntensiveParticipantScore(reviewed.taskId(), reviewed.userId());
        events.publish("task.reviewed", Map.of(
                "submissionId", submissionId.toString(),
                "userId", reviewed.userId().toString(),
                "score", String.valueOf(request.score())
        ));
        return reviewed;
    }

    private void recalculateIntensiveParticipantScore(UUID taskId, UUID userId) {
        jdbc.update("""
                UPDATE learning.intensive_participants p
                SET score = reviewed.average_score
                FROM (
                    SELECT t.intensive_id, s.user_id, round(avg(s.score))::int AS average_score
                    FROM learning.task_submissions s
                    JOIN learning.tasks t ON t.id = s.task_id
                    WHERE t.intensive_id IS NOT NULL
                      AND t.intensive_id = (SELECT intensive_id FROM learning.tasks WHERE id = ?)
                      AND s.user_id = ?
                      AND s.status = 'REVIEWED'
                      AND s.score IS NOT NULL
                    GROUP BY t.intensive_id, s.user_id
                ) reviewed
                WHERE p.intensive_id = reviewed.intensive_id
                  AND p.user_id = reviewed.user_id
                """, taskId, userId);
    }
}
