package com.lmsplatform.communication.feature.file.domain;

import java.util.UUID;

public record FileDto(UUID id, UUID ownerUserId, UUID organizationId, String bucket, String objectKey,
                      String originalName, String contentType, long sizeBytes, String accessLevel) {
}
