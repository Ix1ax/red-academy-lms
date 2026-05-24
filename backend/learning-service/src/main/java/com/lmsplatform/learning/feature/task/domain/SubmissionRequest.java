package com.lmsplatform.learning.feature.task.domain;

import java.util.UUID;

public record SubmissionRequest(UUID userId, UUID fileId, String answerText) {
}
