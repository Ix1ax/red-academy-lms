package com.lmsplatform.learning.feature.task.domain;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record TaskCreateRequest(
        UUID courseId,
        UUID intensiveId,
        @NotBlank String title,
        @NotBlank String description,
        String deadlineAt,
        int maxScore
) {
}
