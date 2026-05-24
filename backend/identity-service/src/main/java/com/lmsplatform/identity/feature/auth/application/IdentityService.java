package com.lmsplatform.identity.feature.auth.application;

import com.lmsplatform.identity.feature.auth.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class IdentityService {
    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokens jwtTokens;

    public IdentityService(JdbcTemplate jdbc, PasswordEncoder passwordEncoder, JwtTokens jwtTokens) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokens = jwtTokens;
    }

    public UserSession register(RegisterRequest request) {
        var id = UUID.randomUUID();
        jdbc.update("""
                        INSERT INTO identity.users (id, email, password_hash, full_name, role, organization_id)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                id, request.email().toLowerCase(Locale.ROOT), passwordEncoder.encode(request.password()),
                request.fullName(), "STUDENT", null);
        return sessionFor(findUserByEmail(request.email()));
    }

    public UserSession login(LoginRequest request) {
        var user = findUserByEmail(request.email());
        if (!passwordEncoder.matches(request.password(), user.passwordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return sessionFor(user);
    }

    public UserDto me(String authorization) {
        var userId = jwtTokens.requireUserId(authorization);
        return toDto(findUserById(userId));
    }

    public List<UserDto> users(String authorization) {
        jwtTokens.requireRole(authorization, List.of("ADMIN"));
        return jdbc.query("""
                SELECT id, email, password_hash, full_name, role, organization_id, created_at
                FROM identity.users
                ORDER BY created_at DESC
                """, (rs, rowNum) -> toDto(mapUser(rs)));
    }

    public List<UserDto> searchUsers(String authorization, String query) {
        jwtTokens.requireRole(authorization, List.of("ADMIN", "PARTNER_MANAGER"));
        var normalized = "%" + (query == null ? "" : query.toLowerCase(Locale.ROOT).trim()) + "%";
        return jdbc.query("""
                SELECT id, email, password_hash, full_name, role, organization_id, created_at
                FROM identity.users
                WHERE lower(email) LIKE ? OR lower(full_name) LIKE ?
                ORDER BY created_at DESC
                LIMIT 20
                """, (rs, rowNum) -> toDto(mapUser(rs)), normalized, normalized);
    }

    private UserSession sessionFor(UserRecord user) {
        return new UserSession(toDto(user), jwtTokens.accessToken(user), jwtTokens.refreshToken(user));
    }

    private UserRecord findUserByEmail(String email) {
        var users = jdbc.query("""
                SELECT id, email, password_hash, full_name, role, organization_id, created_at
                FROM identity.users
                WHERE email = ?
                """, (rs, rowNum) -> mapUser(rs), email.toLowerCase(Locale.ROOT));
        if (users.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return users.get(0);
    }

    private UserRecord findUserById(UUID id) {
        var users = jdbc.query("""
                SELECT id, email, password_hash, full_name, role, organization_id, created_at
                FROM identity.users
                WHERE id = ?
                """, (rs, rowNum) -> mapUser(rs), id);
        if (users.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        return users.get(0);
    }

    private UserRecord mapUser(ResultSet rs) throws SQLException {
        return new UserRecord(
                rs.getObject("id", UUID.class),
                rs.getString("email"),
                rs.getString("password_hash"),
                rs.getString("full_name"),
                rs.getString("role"),
                rs.getObject("organization_id", UUID.class),
                rs.getTimestamp("created_at").toInstant()
        );
    }

    private UserDto toDto(UserRecord user) {
        return new UserDto(user.id(), user.email(), user.fullName(), user.role(), user.organizationId(), user.createdAt());
    }
}
