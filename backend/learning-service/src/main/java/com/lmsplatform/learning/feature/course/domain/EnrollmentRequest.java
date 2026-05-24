package com.lmsplatform.learning.feature.course.domain;

import java.util.UUID;

public record EnrollmentRequest(UUID userId, UUID organizationId) {
}
