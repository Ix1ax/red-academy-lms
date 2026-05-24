package com.lmsplatform.identity.feature.auth.application;

import com.lmsplatform.identity.feature.auth.domain.UserRecord;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
public class JwtTokens {
    private final SecretKey accessKey;
    private final SecretKey refreshKey;

    public JwtTokens(@Value("${jwt.access-secret}") String accessSecret,
                     @Value("${jwt.refresh-secret}") String refreshSecret) {
        this.accessKey = Keys.hmacShaKeyFor(accessSecret.getBytes(StandardCharsets.UTF_8));
        this.refreshKey = Keys.hmacShaKeyFor(refreshSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String accessToken(UserRecord user) {
        return token(user, accessKey, 60 * 60);
    }

    public String refreshToken(UserRecord user) {
        return token(user, refreshKey, 60 * 60 * 24 * 14);
    }

    public UUID requireUserId(String authorization) {
        var subject = claims(authorization).getSubject();
        if (subject == null || subject.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid bearer token");
        }
        try {
            return UUID.fromString(subject);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid bearer token");
        }
    }

    public void requireRole(String authorization, List<String> roles) {
        var role = claims(authorization).get("role", String.class);
        if (role == null || !roles.contains(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient role");
        }
    }

    private io.jsonwebtoken.Claims claims(String authorization) {
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

    private String token(UserRecord user, SecretKey key, long ttlSeconds) {
        var now = Instant.now();
        return Jwts.builder()
                .subject(user.id().toString())
                .claim("email", user.email())
                .claim("role", user.role())
                .claim("organizationId", user.organizationId() == null ? null : user.organizationId().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(ttlSeconds)))
                .signWith(key)
                .compact();
    }
}
