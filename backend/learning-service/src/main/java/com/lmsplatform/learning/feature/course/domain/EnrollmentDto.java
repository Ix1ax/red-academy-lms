package com.lmsplatform.learning.feature.course.domain;

import java.util.UUID;

public record EnrollmentDto(UUID id, UUID userId, UUID courseId, int progress, String status) {
}
