package com.lmsplatform.learning.feature.intensive.domain;

import java.time.Instant;
import java.util.UUID;

public record IntensiveProgramBlockDto(
        UUID id,
        int day,
        String title,
        String description,
        String taskTitle,
        String taskDescription,
        Instant unlocksAt,
        Instant deadlineAt,
        boolean locked
) {
}
