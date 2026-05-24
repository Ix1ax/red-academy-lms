package com.lmsplatform.learning.feature.course.domain;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.UUID;

public record CourseContentNodeDto(
        UUID id,
        UUID parentId,
        String type,
        String title,
        String htmlContent,
        JsonNode testSchema,
        Integer estimatedMinutes,
        int position
) {
}
