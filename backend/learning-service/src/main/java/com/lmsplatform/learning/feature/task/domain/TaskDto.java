package com.lmsplatform.learning.feature.task.domain;

import java.util.UUID;

public record TaskDto(UUID id, UUID courseId, UUID intensiveId, String title, String description, int maxScore) {
}
