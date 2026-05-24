package com.lmsplatform.organization.feature.organization.domain;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record PartnerRequestCreateRequest(UUID organizationId, String companyName, @NotBlank @Email String contactEmail,
                                          String description) {
}
