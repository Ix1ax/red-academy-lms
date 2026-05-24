package com.lmsplatform.learning.feature.task.domain;

import java.util.UUID;

public record SubmissionDto(
        UUID id,
        UUID taskId,
        UUID userId,
        UUID fileId,
        String answerText,
        Integer score,
        String status,
        String reviewerComment
) {
}
