package com.lmsplatform.identity.feature.auth.domain;

import java.time.Instant;
import java.util.UUID;

public record UserDto(UUID id, String email, String fullName, String role, UUID organizationId, Instant createdAt) {
}
