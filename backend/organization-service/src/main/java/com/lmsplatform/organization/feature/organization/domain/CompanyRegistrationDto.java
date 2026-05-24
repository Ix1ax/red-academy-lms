package com.lmsplatform.organization.feature.organization.domain;

import java.util.UUID;

public record CompanyRegistrationDto(OrganizationDto organization, UUID managerUserId) {
}
