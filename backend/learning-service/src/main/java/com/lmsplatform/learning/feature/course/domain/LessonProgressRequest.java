package com.lmsplatform.learning.feature.course.domain;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.UUID;

public record LessonProgressRequest(UUID userId, UUID organizationId, JsonNode answerJson) {
}
