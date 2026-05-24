package com.lmsplatform.organization.feature.organization.domain;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record MemberCreateRequest(UUID userId, @NotBlank String role) {
}
