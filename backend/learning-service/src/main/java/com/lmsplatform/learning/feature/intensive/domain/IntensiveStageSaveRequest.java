package com.lmsplatform.learning.feature.intensive.domain;

/**
 * Request to save (create or update) an intensive stage.
 * startsAt and endsAt are optional ISO-8601 datetime strings.
 * If omitted, the backend auto-distributes dates based on the intensive start/end.
 */
public record IntensiveStageSaveRequest(
        String title,
        String description,
        String taskTitle,
        String taskDescription,
        String startsAt,
        String endsAt
) {
}
