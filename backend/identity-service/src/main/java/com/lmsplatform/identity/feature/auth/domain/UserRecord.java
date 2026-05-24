package com.lmsplatform.identity.feature.auth.domain;

import java.time.Instant;
import java.util.UUID;

public record UserRecord(UUID id, String email, String passwordHash, String fullName, String role, UUID organizationId,
                         Instant createdAt) {
}
