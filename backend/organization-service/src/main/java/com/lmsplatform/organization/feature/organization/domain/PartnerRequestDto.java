package com.lmsplatform.organization.feature.organization.domain;

import java.time.Instant;
import java.util.UUID;

public record PartnerRequestDto(UUID id, UUID organizationId, String companyName, String contactEmail,
                                String description, String status, Instant createdAt, Instant reviewedAt,
                                String reviewReason) {
}
