package com.lmsplatform.learning.feature.course.domain;

import java.util.UUID;

public record LessonProgressDto(UUID lessonId, UUID userId, UUID courseId, String status, int score, int courseProgress) {
}
