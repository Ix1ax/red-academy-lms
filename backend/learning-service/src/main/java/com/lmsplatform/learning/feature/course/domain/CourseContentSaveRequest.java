package com.lmsplatform.learning.feature.course.domain;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CourseContentSaveRequest(@NotNull List<CourseContentNodeDto> items) {
}
