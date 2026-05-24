package com.lmsplatform.learning.feature.course.domain;

import java.util.List;
import java.util.UUID;

public record CourseContentItemDto(
        UUID id,
        UUID parentId,
        String type,
        String title,
        String html,
        List<TestQuestionDto> questions,
        int position,
        int estimatedMinutes
) {
}
