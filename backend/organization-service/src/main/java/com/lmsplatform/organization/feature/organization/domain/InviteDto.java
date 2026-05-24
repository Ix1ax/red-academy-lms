package com.lmsplatform.organization.feature.organization.domain;

import java.time.Instant;
import java.util.UUID;

public record InviteDto(
        UUID id,
        UUID organizationId,
        String organizationName,
        String email,
        String role,
        String status,
        String message,
        Instant createdAt,
        Instant acceptedAt
) {}
