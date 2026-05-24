package com.lmsplatform.organization.feature.organization.domain;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CompanyRegisterRequest(
        @NotBlank String companyName,
        @NotBlank @Email String contactEmail,
        String managerFullName,
        @NotBlank String password,
        String description
) {
}
