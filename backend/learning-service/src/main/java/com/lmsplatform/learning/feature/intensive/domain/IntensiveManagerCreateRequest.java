package com.lmsplatform.learning.feature.intensive.domain;

import java.util.UUID;

public record IntensiveManagerCreateRequest(UUID userId, UUID organizationId, String role) {
}
