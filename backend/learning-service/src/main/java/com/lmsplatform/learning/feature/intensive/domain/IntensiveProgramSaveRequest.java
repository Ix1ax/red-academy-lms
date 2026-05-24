package com.lmsplatform.learning.feature.intensive.domain;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record IntensiveProgramSaveRequest(@NotNull List<IntensiveProgramBlockDto> blocks) {
}
