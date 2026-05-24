package com.lmsplatform.learning.feature.intensive.domain;

import java.util.UUID;

public record ParticipantDto(UUID id, UUID intensiveId, UUID userId, UUID organizationId, String githubUrl, int score, String status, String email, String fullName) {
}
