package com.lmsplatform.organization.feature.organization.domain;

public record PlatformStatsDto(
        int users,
        int organizations,
        int courses,
        int publicCourses,
        int companyCourses,
        int intensives,
        int partnerRequests
) {
}
