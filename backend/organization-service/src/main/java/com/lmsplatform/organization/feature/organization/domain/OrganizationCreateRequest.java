package com.lmsplatform.organization.feature.organization.domain;

import jakarta.validation.constraints.NotBlank;

public record OrganizationCreateRequest(@NotBlank String name, @NotBlank String type, String description) {
}
