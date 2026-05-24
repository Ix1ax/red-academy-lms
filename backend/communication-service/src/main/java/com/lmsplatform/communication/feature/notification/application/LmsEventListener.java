package com.lmsplatform.communication.feature.notification.application;

import com.lmsplatform.communication.config.RabbitConfig;
import com.lmsplatform.communication.feature.notification.domain.NotificationDto;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Component
public class LmsEventListener {
    private final JdbcTemplate jdbc;
    private final SimpMessagingTemplate messaging;

    public LmsEventListener(JdbcTemplate jdbc, SimpMessagingTemplate messaging) {
        this.jdbc = jdbc;
        this.messaging = messaging;
    }

    @RabbitListener(queues = RabbitConfig.NOTIFICATIONS_QUEUE)
    public void onEvent(Map<String, Object> event) {
        var title = "Событие платформы";
        var message = "Получено событие: " + event;
        var id = UUID.randomUUID();
        UUID userId = parseUuid(event.get("userId"));
        UUID organizationId = parseUuid(event.get("organizationId"));
        jdbc.update("""
                        INSERT INTO communication.notifications (id, user_id, organization_id, title, message, type)
                        VALUES (?, ?, ?, ?, ?, 'SYSTEM')
                        """, id, userId, organizationId, title, message);
        var notification = new NotificationDto(id, userId, organizationId, title, message, "SYSTEM", null, Instant.now());
        if (userId != null) {
            messaging.convertAndSend("/queue/users/" + userId + "/notifications", notification);
        }
        if (organizationId != null) {
            messaging.convertAndSend("/topic/organizations/" + organizationId + "/events", notification);
        }
        messaging.convertAndSend("/topic/platform/events", notification);
    }

    private UUID parseUuid(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return UUID.fromString(String.valueOf(value));
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
