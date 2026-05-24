package com.lmsplatform.learning.feature.course.domain;

import java.time.Instant;
import java.util.UUID;

public record CourseDto(
        UUID id,
        String title,
        String description,
        String authorType,
        String courseType,
        UUID organizationId,
        String level,
        int durationHours,
        String status,
        String coverUrl,
        Instant createdAt,
        boolean hasCertificate
) {
}
