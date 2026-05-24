package com.lmsplatform.learning.feature.course.domain;

import java.util.List;

public record TestQuestionDto(
        String type,
        String title,
        List<String> options,
        List<String> answers
) {
}
