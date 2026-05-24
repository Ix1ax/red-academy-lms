package com.lmsplatform.learning.feature.intensive.domain;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record IntensiveProgramDto(
        UUID intensiveId,
        int durationDays,
        String answerType,
        Instant updatedAt,
        List<IntensiveProgramBlockDto> blocks
) {
}
