package com.lmsplatform.learning.feature.course.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CourseContentDto(
        UUID courseId,
        String version,
        Instant updatedAt,
        List<CourseContentNodeDto> items
) {
}
