package com.lmsplatform.learning.feature.course.domain;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.UUID;

public record LessonDto(
        UUID id,
        UUID courseId,
        UUID parentId,
        String type,
        String title,
        String content,
        String htmlContent,
        JsonNode testSchema,
        int estimatedMinutes,
        int position
) {
}
