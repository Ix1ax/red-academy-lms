package com.lmsplatform.identity.feature.auth.domain;

public record UpdateProfileRequest(String fullName, String currentPassword, String newPassword) {
}
