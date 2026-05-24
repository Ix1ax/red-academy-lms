package com.lmsplatform.learning.feature.course.domain;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record LessonCreateRequest(
        UUID parentId,
        String type,
        @NotBlank String title,
        String content,
        String htmlContent,
        JsonNode testSchema,
        Integer estimatedMinutes,
        int position
) {
}
