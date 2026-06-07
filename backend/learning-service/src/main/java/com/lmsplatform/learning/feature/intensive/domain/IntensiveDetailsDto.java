package com.lmsplatform.learning.feature.intensive.domain;

import java.util.List;
import java.util.UUID;

public record IntensiveDetailsDto(
        IntensiveDto intensive,
        List<IntensiveStageDto> stages,
        List<ParticipantDto> rating,
        List<ApplicationDto> applications,
        List<IntensiveSubmissionDto> submissions,
        List<UUID> mentorUserIds,
        List<MentorDto> mentors
) {
    public record MentorDto(UUID userId, String fullName, String email) {
    }
}
