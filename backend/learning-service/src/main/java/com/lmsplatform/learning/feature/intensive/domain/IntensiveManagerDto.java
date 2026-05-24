package com.lmsplatform.learning.feature.intensive.domain;

import java.util.UUID;

public record IntensiveManagerDto(UUID id, UUID intensiveId, UUID userId, UUID organizationId, String role, String status) {
}
