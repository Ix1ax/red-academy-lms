package com.lmsplatform.learning.shared.security;

import java.util.UUID;

/**
 * Identity extracted from a verified access token.
 */
public record AuthPrincipal(UUID userId, String role, UUID organizationId) {
    public boolean hasRole(String expected) {
        return expected != null && expected.equals(role);
    }
}
