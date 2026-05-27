import { apiUrl } from "./config";
import { getAccessToken, persistSession } from "@/shared/auth/session";

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      persistSession(null);
      throw new Error("Сессия истекла. Войдите заново.");
    }
    const text = await response.text();
    throw new Error(readApiError(text) || "Не удалось выполнить действие. Попробуйте еще раз.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

function readApiError(text: string) {
  if (!text) return "";
  try {
    const parsed = JSON.parse(text) as { message?: string; error?: string; status?: number };
    return parsed.message || parsed.error || text;
  } catch {
    return text;
  }
}
