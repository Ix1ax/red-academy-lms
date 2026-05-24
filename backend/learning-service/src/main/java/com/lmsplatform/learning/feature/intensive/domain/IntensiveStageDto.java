package com.lmsplatform.learning.feature.intensive.domain;

import java.time.Instant;
import java.util.UUID;

public record IntensiveStageDto(
        UUID id,
        UUID intensiveId,
        String title,
        String description,
        String taskTitle,
        String taskDescription,
        String answerType,
        int position,
        Instant startsAt,
        Instant endsAt
) {
}
