package com.lmsplatform.learning.feature.intensive.domain;

import java.time.Instant;
import java.util.UUID;

public record IntensiveDto(
        UUID id,
        String title,
        String description,
        String organizerType,
        UUID organizationId,
        String status,
        Instant startsAt,
        Instant endsAt,
        /** Deadline for participant applications. Defaults to startsAt if not set. */
        Instant registrationDeadline,
        /** Optional cover image URL. */
        String coverUrl,
        int participantLimit,
        Instant createdAt
) {
}
