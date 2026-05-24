package com.lmsplatform.learning.feature.certificate.domain;

import java.time.Instant;
import java.util.UUID;

public record CertificateDto(UUID id, UUID userId, UUID courseId, UUID intensiveId, String title, UUID fileId,
                             Instant issuedAt) {
}
