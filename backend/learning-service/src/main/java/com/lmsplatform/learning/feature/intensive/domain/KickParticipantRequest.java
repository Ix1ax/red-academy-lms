package com.lmsplatform.learning.feature.intensive.domain;

import java.util.UUID;

public record KickParticipantRequest(UUID managerUserId, String reason) {
}
