package com.lmsplatform.communication.feature.notification.api;

import com.lmsplatform.communication.feature.notification.application.NotificationService;
import com.lmsplatform.communication.feature.notification.domain.NotificationCreateRequest;
import com.lmsplatform.communication.feature.notification.domain.NotificationDto;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notifications;

    public NotificationController(NotificationService notifications) {
        this.notifications = notifications;
    }

    @GetMapping
    public List<NotificationDto> list(@RequestParam(value = "userId", required = false) UUID userId,
                                      @RequestParam(value = "organizationId", required = false) UUID organizationId) {
        return notifications.list(userId, organizationId);
    }

    @PostMapping
    public NotificationDto create(@RequestBody NotificationCreateRequest request) {
        return notifications.create(request);
    }

    @PostMapping("/{id}/read")
    public void markAsRead(@PathVariable("id") UUID id) {
        notifications.markAsRead(id);
    }
}
