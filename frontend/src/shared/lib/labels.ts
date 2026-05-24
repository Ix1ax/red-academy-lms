export function courseStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    DRAFT: "Черновик",
    PUBLISHED: "Опубликован",
    HIDDEN: "Скрыт",
    ARCHIVED: "В архиве"
  };
  return labels[status ?? ""] ?? "Без статуса";
}

export function intensiveStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    DRAFT: "Черновик",
    ENROLLMENT_OPEN: "Набор открыт",
    ENROLLMENT_CLOSED: "Набор закрыт",
    IN_PROGRESS: "Идет обучение",
    COMPLETED: "Завершен",
    HIDDEN: "Скрыт"
  };
  return labels[status ?? ""] ?? "Без статуса";
}

export function applicationStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    PENDING: "На рассмотрении",
    APPROVED: "Одобрена",
    REJECTED: "Отклонена"
  };
  return labels[status ?? ""] ?? "Без статуса";
}

export function participantStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    ACTIVE: "Участвует",
    ELIMINATED: "Исключен",
    COMPLETED: "Завершил"
  };
  return labels[status ?? ""] ?? "Без статуса";
}

export function submissionStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    SUBMITTED: "На проверке",
    REVIEWED: "Проверено"
  };
  return labels[status ?? ""] ?? "Без статуса";
}

export function levelLabel(level?: string | null) {
  const labels: Record<string, string> = {
    BEGINNER: "Начальный",
    INTERMEDIATE: "Средний",
    ADVANCED: "Продвинутый"
  };
  return labels[level ?? ""] ?? "Любой уровень";
}

export function memberRoleLabel(role?: string | null) {
  const labels: Record<string, string> = {
    OWNER: "Владелец",
    STUDENT: "Пользователь",
    CORPORATE_STUDENT: "Сотрудник",
    PARTNER_MANAGER: "Компания-партнёр",
    MENTOR: "Наставник",
    ADMIN: "Владелец платформы"
  };
  return labels[role ?? ""] ?? "Участник";
}
