package com.lmsplatform.learning.feature.intensive.domain;

import java.util.UUID;

public record IntensiveSubmissionRequest(UUID userId, String githubUrl, String answerText) {
}
