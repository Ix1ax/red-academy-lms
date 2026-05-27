package com.lmsplatform.communication.feature.notification.application;

import com.lmsplatform.communication.config.RabbitConfig;
import com.lmsplatform.communication.feature.notification.domain.NotificationDto;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Component
public class LmsEventListener {
    private final JdbcTemplate jdbc;
    private final SimpMessagingTemplate messaging;

    public LmsEventListener(JdbcTemplate jdbc, SimpMessagingTemplate messaging) {
        this.jdbc = jdbc;
        this.messaging = messaging;
    }

    @RabbitListener(queues = RabbitConfig.NOTIFICATIONS_QUEUE)
    public void onEvent(Map<String, Object> event) {
        var eventType = text(event.get("eventType"), "system.event");
        var content = contentFor(eventType, event);
        var id = UUID.randomUUID();
        UUID userId = targetUserId(eventType, event);
        UUID organizationId = parseUuid(event.get("organizationId"));
        var notificationType = notificationType(eventType);
        jdbc.update("""
                        INSERT INTO communication.notifications (id, user_id, organization_id, title, message, type)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """, id, userId, organizationId, content.title(), content.message(), notificationType);
        var notification = new NotificationDto(id, userId, organizationId, content.title(), content.message(), notificationType, null, Instant.now());
        if (userId != null) {
            messaging.convertAndSend("/queue/users/" + userId + "/notifications", notification);
        }
        if (organizationId != null) {
            messaging.convertAndSend("/topic/organizations/" + organizationId + "/events", notification);
        }
        messaging.convertAndSend("/topic/platform/events", notification);
    }

    private NotificationContent contentFor(String eventType, Map<String, Object> event) {
        return switch (eventType) {
            case "course.created" -> new NotificationContent("Курс создан", "Новый курс сохранён в рабочей области.");
            case "course.updated", "course.content_saved" -> new NotificationContent("Курс обновлён", "Изменения курса сохранены.");
            case "course.status_changed" -> new NotificationContent("Статус курса изменён", "Новый статус: " + text(event.get("status"), "обновлён") + ".");
            case "course.deleted" -> new NotificationContent("Курс удалён", "Курс удалён из каталога.");
            case "course.enrollment_created", "course.auto_enrolled" -> new NotificationContent("Вы записаны на курс", "Курс добавлен в личное обучение.");
            case "course.lesson_completed" -> new NotificationContent("Урок засчитан", "Прогресс по курсу обновлён.");
            case "course.completed" -> new NotificationContent("Курс завершён", "Поздравляем, курс пройден полностью.");
            case "certificate.issued" -> new NotificationContent("Сертификат выпущен", "Сертификат доступен в личном кабинете.");
            case "task.submitted", "intensive.stage_submitted" -> new NotificationContent("Решение отправлено", "Работа принята на проверку.");
            case "task.reviewed" -> new NotificationContent("Решение проверено", "Оценка: " + text(event.get("score"), "выставлена") + ".");
            case "intensive.created" -> new NotificationContent("Интенсив создан", "Интенсив появился в расписании.");
            case "intensive.updated" -> new NotificationContent("Интенсив обновлён", "Параметры и этапы интенсива сохранены.");
            case "intensive.deleted" -> new NotificationContent("Интенсив удалён", "Интенсив удалён из платформы.");
            case "intensive.status_changed" -> new NotificationContent("Статус интенсива изменён", "Новый статус: " + text(event.get("status"), "обновлён") + ".");
            case "intensive.application_submitted" -> new NotificationContent("Новая заявка на интенсив", "Участник отправил заявку на отбор.");
            case "intensive.application_approved" -> new NotificationContent("Заявка одобрена", "Вы зачислены на интенсив.");
            case "intensive.application_rejected" -> new NotificationContent("Заявка отклонена", "Заявка на интенсив не прошла отбор.");
            case "intensive.manager_assigned" -> new NotificationContent("Вы назначены ментором", "Интенсив добавлен в вашу рабочую область.");
            case "intensive.participant_eliminated" -> new NotificationContent("Участник исключён", "Статус участника интенсива обновлён.");
            case "organization.created" -> new NotificationContent("Организация создана", "Карточка организации добавлена на платформу.");
            case "organization.company_registered" -> new NotificationContent("Компания зарегистрирована", "Профиль компании создан. Можно подать заявку на партнёрство.");
            case "organization.partner_requested" -> new NotificationContent("Новая партнёрская заявка", "Компания «" + text(event.get("companyName"), "без названия") + "» ожидает рассмотрения.");
            case "organization.partner_approved" -> new NotificationContent("Партнёрство одобрено", "Компания получила партнёрский доступ.");
            case "organization.partner_rejected" -> new NotificationContent("Партнёрство отклонено", reasonMessage(event));
            case "organization.partner_rework" -> new NotificationContent("Заявка требует доработки", reasonMessage(event));
            case "organization.employee_invited" -> new NotificationContent("Сотрудник добавлен", "Пользователь подключён к организации.");
            case "organization.invite_created" -> new NotificationContent("Новое приглашение", "Вас пригласили присоединиться к компании.");
            case "organization.invite_accepted" -> new NotificationContent("Приглашение принято", "Сотрудник присоединился к компании.");
            default -> new NotificationContent("Событие платформы", "Получено событие: " + eventType + ".");
        };
    }

    private UUID targetUserId(String eventType, Map<String, Object> event) {
        if ("organization.company_registered".equals(eventType)) {
            var managerUserId = parseUuid(event.get("managerUserId"));
            if (managerUserId != null) {
                return managerUserId;
            }
        }
        return parseUuid(event.get("userId"));
    }

    private String notificationType(String eventType) {
        var dot = eventType.indexOf('.');
        return (dot > 0 ? eventType.substring(0, dot) : "system").toUpperCase();
    }

    private String reasonMessage(Map<String, Object> event) {
        var reason = text(event.get("reason"), "");
        return reason.isBlank() ? "Решение по партнёрской заявке обновлено." : reason;
    }

    private String text(Object value, String fallback) {
        if (value == null) {
            return fallback;
        }
        var string = String.valueOf(value);
        return string.isBlank() ? fallback : string;
    }

    private UUID parseUuid(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return UUID.fromString(String.valueOf(value));
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private record NotificationContent(String title, String message) {
    }
}
