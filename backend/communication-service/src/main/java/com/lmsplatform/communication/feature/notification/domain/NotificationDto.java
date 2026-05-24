package com.lmsplatform.communication.feature.notification.domain;

import java.time.Instant;
import java.util.UUID;

public record NotificationDto(UUID id, UUID userId, UUID organizationId, String title, String message, String type,
                              Instant readAt, Instant createdAt) {
}
