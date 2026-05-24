package com.lmsplatform.learning.feature.intensive.domain;

import java.time.Instant;
import java.util.UUID;

public record IntensiveSubmissionDto(
        UUID id,
        UUID taskId,
        UUID userId,
        String githubUrl,
        String answerText,
        String status,
        Integer score,
        Instant submittedAt,
        String stageTitle,
        String email,
        String fullName,
        String reviewerComment
) {
}
