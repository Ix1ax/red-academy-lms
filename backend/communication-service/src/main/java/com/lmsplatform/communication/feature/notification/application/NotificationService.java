package com.lmsplatform.communication.feature.notification.application;

import com.lmsplatform.communication.feature.notification.domain.NotificationCreateRequest;
import com.lmsplatform.communication.feature.notification.domain.NotificationDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {
    private final JdbcTemplate jdbc;

    public NotificationService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<NotificationDto> list(UUID userId, UUID organizationId) {
        if (userId != null) {
            return jdbc.query("""
                    SELECT id, user_id, organization_id, title, message, type, read_at, created_at
                    FROM communication.notifications
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                    """, (rs, rowNum) -> mapNotification(rs), userId);
        }
        if (organizationId != null) {
            return jdbc.query("""
                    SELECT id, user_id, organization_id, title, message, type, read_at, created_at
                    FROM communication.notifications
                    WHERE organization_id = ?
                    ORDER BY created_at DESC
                    """, (rs, rowNum) -> mapNotification(rs), organizationId);
        }
        return jdbc.query("""
                SELECT id, user_id, organization_id, title, message, type, read_at, created_at
                FROM communication.notifications
                ORDER BY created_at DESC
                LIMIT 100
                """, (rs, rowNum) -> mapNotification(rs));
    }

    public NotificationDto create(NotificationCreateRequest request) {
        var id = UUID.randomUUID();
        jdbc.update("""
                        INSERT INTO communication.notifications (id, user_id, organization_id, title, message, type)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """, id, request.userId(), request.organizationId(), request.title(), request.message(), request.type());
        return new NotificationDto(id, request.userId(), request.organizationId(), request.title(), request.message(), request.type(), null, Instant.now());
    }

    public void markAsRead(UUID id) {
        jdbc.update("UPDATE communication.notifications SET read_at = now() WHERE id = ?", id);
    }

    private NotificationDto mapNotification(ResultSet rs) throws SQLException {
        var readAt = rs.getTimestamp("read_at");
        return new NotificationDto(
                rs.getObject("id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getObject("organization_id", UUID.class),
                rs.getString("title"),
                rs.getString("message"),
                rs.getString("type"),
                readAt == null ? null : readAt.toInstant(),
                rs.getTimestamp("created_at").toInstant()
        );
    }
}
