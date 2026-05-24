package com.lmsplatform.learning.feature.course.domain;

import java.util.List;
import java.util.UUID;

public record CourseProgressDto(UUID userId, UUID courseId, int progress, String enrollmentStatus,
                                List<LessonProgressDto> lessons) {
}
