package com.lmsplatform.learning.feature.intensive.domain;

import java.util.UUID;

public record ApplicationRequest(UUID userId, UUID organizationId, String githubUrl) {
}
