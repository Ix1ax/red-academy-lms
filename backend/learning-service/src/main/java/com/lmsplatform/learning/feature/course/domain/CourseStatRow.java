package com.lmsplatform.learning.feature.course.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Single row of course-completion statistics: how a particular learner progressed through a course.
 */
public record CourseStatRow(
        UUID userId,
        String userName,
        String userEmail,
        String userRole,
        UUID courseId,
        String courseTitle,
        String courseType,
        String courseStatus,
        UUID organizationId,
        String organizationName,
        int progress,
        String enrollmentStatus,
        int completedLessons,
        int totalLessons,
        boolean certificateIssued,
        Instant enrolledAt,
        Instant updatedAt
) {
}
