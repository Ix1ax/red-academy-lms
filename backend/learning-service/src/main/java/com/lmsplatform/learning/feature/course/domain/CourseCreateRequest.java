package com.lmsplatform.learning.feature.course.domain;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record CourseCreateRequest(
        @NotBlank String title,
        @NotBlank String description,
        @NotBlank String authorType,
        String courseType,
        UUID organizationId,
        @NotBlank String level,
        int durationHours,
        String coverUrl,
        boolean hasCertificate
) {
}
