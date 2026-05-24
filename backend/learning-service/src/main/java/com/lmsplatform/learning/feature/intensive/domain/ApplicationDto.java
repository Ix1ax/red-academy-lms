package com.lmsplatform.learning.feature.intensive.domain;

import java.util.UUID;

public record ApplicationDto(UUID id, UUID intensiveId, UUID userId, UUID organizationId, String githubUrl, String status, String email, String fullName) {
}
