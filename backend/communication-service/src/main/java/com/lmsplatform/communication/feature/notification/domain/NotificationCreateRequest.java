package com.lmsplatform.communication.feature.notification.domain;

import java.util.UUID;

public record NotificationCreateRequest(UUID userId, UUID organizationId, String title, String message, String type) {
}
