package com.lmsplatform.learning.feature.course.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CourseContentDocumentDto(
        UUID courseId,
        int version,
        Instant updatedAt,
        List<CourseContentItemDto> items
) {
}
