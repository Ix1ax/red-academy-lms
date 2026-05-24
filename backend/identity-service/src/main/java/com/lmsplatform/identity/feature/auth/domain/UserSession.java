package com.lmsplatform.identity.feature.auth.domain;

public record UserSession(UserDto user, String accessToken, String refreshToken) {
}
