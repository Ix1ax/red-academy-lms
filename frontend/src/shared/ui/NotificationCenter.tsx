import { apiRequest } from "@/shared/api/client";
import type { Session } from "@/shared/auth/session";
import { toastSuccess } from "@/shared/ui/toast";
import { Bell, CheckCheck, Inbox, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type NotificationItem = {
  id: string;
  userId?: string | null;
  organizationId?: string | null;
  title: string;
  message: string;
  type: string;
  readAt?: string | null;
  createdAt: string;
};

const seenKeyPrefix = "lms-notifications-seen-at";

export function NotificationCenter({ session }: { session: Session | null }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const loadedOnce = useRef(false);
  const lastSeenAt = useRef("");

  const storageKey = session ? `${seenKeyPrefix}:${session.user.id}` : seenKeyPrefix;
  const unreadCount = items.filter((item) => !item.readAt).length;

  const loadNotifications = useCallback(async () => {
    if (!session) {
      setItems([]);
      setError("");
      return;
    }

    setLoading((current) => (loadedOnce.current ? current : true));
    setError("");
    try {
      const params = new URLSearchParams({ userId: session.user.id });
      if (session.user.organizationId) params.set("organizationId", session.user.organizationId);
      const loaded = await apiRequest<NotificationItem[]>(`/api/notifications?${params.toString()}`);
      const merged = mergeNotifications(loaded).slice(0, 30);
      const newest = merged[0];
      if (!loadedOnce.current) {
        lastSeenAt.current = localStorage.getItem(storageKey) || newest?.createdAt || "";
        loadedOnce.current = true;
      } else {
        const fresh = merged.filter((item) => !item.readAt && item.createdAt > lastSeenAt.current);
        fresh.slice(0, 2).forEach((item) => toastSuccess(item.title, item.message));
      }

      if (newest?.createdAt && newest.createdAt > lastSeenAt.current) {
        lastSeenAt.current = newest.createdAt;
        localStorage.setItem(storageKey, newest.createdAt);
      }
      setItems(merged);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось загрузить уведомления");
    } finally {
      setLoading(false);
    }
  }, [session, storageKey]);

  useEffect(() => {
    loadedOnce.current = false;
    lastSeenAt.current = "";
    loadNotifications();
    if (!session) return undefined;
    const timer = window.setInterval(loadNotifications, 45_000);
    return () => window.clearInterval(timer);
  }, [loadNotifications, session]);

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const markRead = async (id: string) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: "POST" });
    } catch {
      loadNotifications();
    }
  };

  const markAllRead = () => {
    items.filter((item) => !item.readAt).forEach((item) => markRead(item.id));
  };

  if (!session) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative grid h-8 w-8 place-items-center rounded-xl border border-line bg-white text-ink transition hover:border-red-200 hover:text-primary sm:h-9 sm:w-9"
        aria-label="Уведомления"
        title="Уведомления"
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[min(360px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-panel">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Уведомления</p>
              <p className="text-xs text-muted">{unreadCount ? `Непрочитанных: ${unreadCount}` : "Все прочитано"}</p>
            </div>
            <div className="flex items-center gap-1">
              {loading && <Loader2 className="animate-spin text-muted" size={16} />}
              <button
                type="button"
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-primary-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Отметить все прочитанными"
                title="Отметить все прочитанными"
              >
                <CheckCheck size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {error && <p className="px-4 py-3 text-sm text-primary">{error}</p>}
            {!error && items.length === 0 && (
              <div className="grid place-items-center gap-2 px-4 py-8 text-center">
                <Inbox className="text-muted" size={24} />
                <p className="text-sm font-medium text-ink">Пока пусто</p>
                <p className="text-xs leading-5 text-muted">Здесь появятся события курсов, интенсивов и компании.</p>
              </div>
            )}
            {!error && items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => markRead(item.id)}
                className={`grid w-full gap-1 border-b border-line px-4 py-3 text-left transition last:border-b-0 hover:bg-surface ${
                  item.readAt ? "bg-white" : "bg-primary-light/55"
                }`}
              >
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-ink">{item.title}</span>
                  <span className="shrink-0 text-[11px] text-muted">{formatRelativeTime(item.createdAt)}</span>
                </div>
                <p className="line-clamp-2 text-xs leading-5 text-muted">{item.message}</p>
                <span className="w-fit rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">{item.type}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function mergeNotifications(items: NotificationItem[]) {
  const byId = new Map<string, NotificationItem>();
  items.forEach((item) => byId.set(item.id, item));
  return Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (diffMinutes < 1) return "сейчас";
  if (diffMinutes < 60) return `${diffMinutes} мин`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ч`;
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}
