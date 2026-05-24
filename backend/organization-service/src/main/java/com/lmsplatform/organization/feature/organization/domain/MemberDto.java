package com.lmsplatform.organization.feature.organization.domain;

import java.util.UUID;

public record MemberDto(UUID id, UUID organizationId, UUID userId, String role, String status, String email, String fullName) {
}
