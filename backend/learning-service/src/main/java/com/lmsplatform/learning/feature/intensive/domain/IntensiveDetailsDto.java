package com.lmsplatform.learning.feature.intensive.domain;

import java.util.List;

public record IntensiveDetailsDto(
        IntensiveDto intensive,
        List<IntensiveStageDto> stages,
        List<ParticipantDto> rating,
        List<ApplicationDto> applications,
        List<IntensiveSubmissionDto> submissions
) {
}
