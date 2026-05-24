package com.lmsplatform.learning.feature.course.domain;

import java.util.UUID;

public record ProgressRequest(UUID userId, UUID organizationId, int progress) {
}
