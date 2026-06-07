package com.lmsplatform.learning.shared.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Verifies access tokens issued by identity-service (shared HMAC secret) and exposes the caller's claims.
 */
@Service
public class JwtAuthService {
    private final SecretKey accessKey;

    public JwtAuthService(@Value("${jwt.access-secret}") String accessSecret) {
        this.accessKey = Keys.hmacShaKeyFor(accessSecret.getBytes(StandardCharsets.UTF_8));
    }

    public AuthPrincipal requirePrincipal(String authorization) {
        var claims = claims(authorization);
        UUID userId = parseUuid(claims.getSubject());
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid bearer token");
        }
        var role = claims.get("role", String.class);
        var organizationId = parseUuid(claims.get("organizationId", String.class));
        return new AuthPrincipal(userId, role, organizationId);
    }

    private Claims claims(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing bearer token");
        }
        try {
            return Jwts.parser().verifyWith(accessKey).build()
                    .parseSignedClaims(authorization.substring(7))
                    .getPayload();
        } catch (JwtException | IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid bearer token");
        }
    }

    private UUID parseUuid(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
