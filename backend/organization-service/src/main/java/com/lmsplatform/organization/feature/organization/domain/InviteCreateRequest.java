package com.lmsplatform.organization.feature.organization.domain;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record InviteCreateRequest(
        @NotBlank @Email String email,
        String message
) {}
