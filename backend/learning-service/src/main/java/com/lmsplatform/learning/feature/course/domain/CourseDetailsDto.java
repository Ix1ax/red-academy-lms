package com.lmsplatform.learning.feature.course.domain;

import java.util.List;

public record CourseDetailsDto(CourseDto course, List<LessonDto> lessons) {
}
