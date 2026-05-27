export type Role =
  | "STUDENT"
  | "CORPORATE_STUDENT"
  | "PARTNER_MANAGER"
  | "MENTOR"
  | "ADMIN";

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  organizationId?: string | null;
};

export type Session = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export const sessionStorageKey = "lms-session";
export const sessionChangeEvent = "lms-session-change";

export const roleLabels: Record<Role, string> = {
  STUDENT: "Пользователь",
  CORPORATE_STUDENT: "Сотрудник компании",
  PARTNER_MANAGER: "Компания-партнёр",
  MENTOR: "Наставник",
  ADMIN: "Основная компания"
};

export function loadSession(): Session | null {
  const saved = localStorage.getItem(sessionStorageKey);
  if (!saved) return null;

  try {
    return JSON.parse(saved) as Session;
  } catch {
    localStorage.removeItem(sessionStorageKey);
    return null;
  }
}

export function persistSession(session: Session | null) {
  if (session) {
    localStorage.setItem(sessionStorageKey, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent(sessionChangeEvent, { detail: session }));
    return;
  }

  localStorage.removeItem(sessionStorageKey);
  window.dispatchEvent(new CustomEvent(sessionChangeEvent, { detail: null }));
}

export function getAccessToken() {
  return loadSession()?.accessToken;
}

export function hasRole(session: Session | null, roles?: Role[]) {
  if (!roles || roles.length === 0) return true;
  return Boolean(session && roles.includes(session.user.role));
}
