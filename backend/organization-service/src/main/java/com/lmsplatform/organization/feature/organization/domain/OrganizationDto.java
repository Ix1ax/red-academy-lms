package com.lmsplatform.organization.feature.organization.domain;

import java.time.Instant;
import java.util.UUID;

public record OrganizationDto(UUID id, String name, String type, String status, String description, String inn, String ogrn, Instant createdAt,
                              UUID docInnId, UUID docEgrulId, UUID docCharterId, UUID docPoaId) {
}
