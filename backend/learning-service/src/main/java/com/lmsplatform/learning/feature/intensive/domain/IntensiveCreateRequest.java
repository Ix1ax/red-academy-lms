package com.lmsplatform.learning.feature.intensive.domain;

import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.UUID;

public record IntensiveCreateRequest(
        @NotBlank String title,
        @NotBlank String description,
        @NotBlank String organizerType,
        UUID organizationId,
        @NotBlank String startsAt,
        @NotBlank String endsAt,
        /** ISO-8601 deadline for participant applications; defaults to startsAt if omitted. */
        String registrationDeadline,
        /** Optional URL of the intensive cover image (stored in S3/MinIO). */
        String coverUrl,
        int participantLimit,
        UUID creatorUserId,
        List<UUID> managerUserIds,
        List<IntensiveStageSaveRequest> stages
) {
}
