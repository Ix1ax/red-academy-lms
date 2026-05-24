package com.lmsplatform.organization.feature.organization.domain;

import java.time.Instant;
import java.util.UUID;

public record OrganizationDto(UUID id, String name, String type, String status, String description, Instant createdAt) {
}
