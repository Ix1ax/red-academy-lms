import { apiRequest } from "@/shared/api/client";
import type { Session } from "@/shared/auth/session";
import { applicationStatusLabel } from "@/shared/lib/labels";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import {
  Bell,
  Building2,
  CheckCircle2,
  Clock3,
  Send,
  ShieldCheck,
  UserCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PartnerRequest = {
  id: string;
  organizationId?: string | null;
  companyName: string;
  contactEmail: string;
  description?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REWORK" | string;
  reviewReason?: string | null;
};

type Invite = {
  id: string;
  organizationId: string;
  organizationName: string;
  email: string;
  role: string;
  status: string;
  message?: string | null;
  createdAt: string;
};

export function ProfilePage({ session }: { session: Session | null }) {
  const [description, setDescription] = useState("");
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [submittingPartnerRequest, setSubmittingPartnerRequest] = useState(false);
  const [acceptingInviteId, setAcceptingInviteId] = useState<string | null>(null);

  const currentRequest = useMemo(
    () => requests.find((r) => r.organizationId === session?.user.organizationId),
    [requests, session?.user.organizationId],
  );
  const isPlatformOwner = session?.user.role === "ADMIN";
  const pendingInvites = useMemo(() => invites.filter((i) => i.status === "PENDING"), [invites]);

  useEffect(() => {
    if (!session) return;
    // Load partner requests
    apiRequest<PartnerRequest[]>("/api/organizations/partner-requests")
      .then(setRequests)
      .catch(() => undefined);
    // Load pending invites for this user's email
    apiRequest<Invite[]>(`/api/organizations/invites/mine?email=${encodeURIComponent(session.user.email)}`)
      .then(setInvites)
      .catch(() => undefined);
  }, [session?.user.id]);

  async function submitPartnerRequest() {
    if (submittingPartnerRequest) return;
    if (!session?.user.organizationId) {
      toastError("Заявку можно подать только из аккаунта компании");
      return;
    }
    setSubmittingPartnerRequest(true);
    try {
      const created = await apiRequest<PartnerRequest>("/api/organizations/partner-requests", {
        method: "POST",
        body: JSON.stringify({
          organizationId: session.user.organizationId,
          contactEmail: session.user.email,
          description,
        }),
      });
      setRequests([created, ...requests]);
      setDescription("");
      toastSuccess("Заявка отправлена", "Статус будет обновляться в профиле.");
    } catch (error) {
      toastError("Не удалось отправить заявку", error instanceof Error ? error.message : undefined);
    } finally {
      setSubmittingPartnerRequest(false);
    }
  }

  async function acceptInvite(invite: Invite) {
    if (acceptingInviteId || !session) return;
    setAcceptingInviteId(invite.id);
    try {
      await apiRequest(`/api/organizations/invites/${invite.id}/accept`, {
        method: "POST",
        body: JSON.stringify({ userId: session.user.id, userEmail: session.user.email }),
      });
      setInvites((prev) => prev.map((i) => (i.id === invite.id ? { ...i, status: "ACCEPTED" } : i)));
      toastSuccess(
        "Вы вступили в компанию!",
        `Теперь вы сотрудник «${invite.organizationName}». Перезайдите для обновления роли.`,
      );
    } catch (e) {
      toastError("Не удалось принять инвайт", e instanceof Error ? e.message : undefined);
    } finally {
      setAcceptingInviteId(null);
    }
  }

  return (
    <div className="grid gap-5">
      {/* User info */}
      <section className="rounded-2xl border border-line bg-white p-6 shadow-panel">
        <div className="flex items-center gap-3">
          <UserRound className="text-primary" size={24} />
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Профиль</h1>
        </div>
        <div className="mt-5 grid gap-3 text-sm text-muted md:grid-cols-3">
          <Info label="Имя" value={session?.user.fullName ?? "Гость"} />
          <Info label="Email" value={session?.user.email ?? "не указан"} />
          <Info
            label="Организация"
            value={session?.user.organizationId ? "Компания подключена" : "Не привязана"}
          />
        </div>
      </section>

      {/* Pending invites — show for all logged-in users */}
      {session && pendingInvites.length > 0 && (
        <section className="rounded-2xl border border-line bg-white p-5 shadow-panel">
          <div className="flex items-center gap-3 mb-4">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <Bell size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-ink">Приглашения в компанию</h2>
              <p className="text-[12px] text-muted">Вам направлены инвайты от работодателей</p>
            </div>
            <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
              {pendingInvites.length}
            </span>
          </div>
          <div className="grid gap-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{invite.organizationName}</p>
                    {invite.message && (
                      <p className="mt-1 text-[13px] leading-5 text-muted italic">
                        "{invite.message}"
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-muted">
                      {new Date(invite.createdAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                  <button
                    onClick={() => acceptInvite(invite)}
                    disabled={acceptingInviteId === invite.id}
                    className="shrink-0 inline-flex h-9 items-center gap-1.5 rounded-xl bg-red-gradient px-3 text-[12px] font-semibold text-white shadow-red-sm transition hover:opacity-90 disabled:opacity-50"
                  >
                    <UserCheck size={13} />
                    {acceptingInviteId === invite.id ? "..." : "Принять"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Platform owner info */}
      {isPlatformOwner ? (
        <section className="rounded-2xl border border-line bg-white p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-primary" size={22} />
            <h2 className="text-lg font-semibold text-ink">Управление платформой</h2>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Вы владелец платформы. Партнерские заявки рассматриваются в административной панели.
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-line bg-white p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <Building2 className="text-primary" size={22} />
            <h2 className="text-lg font-semibold text-ink">Партнерство</h2>
          </div>

          {session?.user.role === "PARTNER_MANAGER" ? (
            <StatusBox
              icon={<CheckCircle2 size={18} />}
              title="Партнерство одобрено"
              text="Вашей организации открыт кабинет партнера и студия создания партнерских курсов."
              tone="success"
            />
          ) : currentRequest ? (
            <div>
              <StatusBox
                icon={
                  currentRequest.status === "APPROVED" ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Clock3 size={18} />
                  )
                }
                title={
                  currentRequest.status === "APPROVED"
                    ? "Партнерство одобрено"
                    : currentRequest.status === "REJECTED"
                      ? "Заявка отклонена"
                      : currentRequest.status === "REWORK"
                        ? "Заявка возвращена на доработку"
                        : `Заявка: ${applicationStatusLabel(currentRequest.status)}`
                }
                text={
                  currentRequest.status === "APPROVED"
                    ? "После следующего входа роль и доступы будут обновлены."
                    : currentRequest.status === "REJECTED"
                      ? "Администратор отклонил заявку."
                      : currentRequest.status === "REWORK"
                        ? "Дополните описание и подайте новую заявку."
                        : "Ожидайте решения администратора основной компании."
                }
                tone={
                  currentRequest.status === "APPROVED"
                    ? "success"
                    : currentRequest.status === "REJECTED"
                      ? "error"
                      : "warning"
                }
              />
              {currentRequest.reviewReason && (
                <div className="mt-3 rounded-2xl border border-line bg-surface p-3">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-muted mb-1">
                    Комментарий администратора
                  </p>
                  <p className="text-[13px] text-ink">{currentRequest.reviewReason}</p>
                </div>
              )}
            </div>
          ) : session?.user.organizationId ? (
            <div className="mt-4 grid gap-3">
              <p className="max-w-2xl text-sm leading-6 text-muted">
                Заявка подается от текущей организации. После одобрения компания получит партнерский
                статус и отдельный кабинет партнера.
              </p>
              <label className="grid gap-1.5 text-sm font-medium text-ink">
                Описание партнерской программы
                <textarea
                  className="min-h-28 rounded-xl border border-line px-3 py-2 outline-none focus:border-primary"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
              <button
                onClick={submitPartnerRequest}
                disabled={submittingPartnerRequest}
                className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-muted"
              >
                <Send size={16} />
                {submittingPartnerRequest ? "Отправляю..." : "Подать заявку"}
              </button>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-surface p-4 text-sm leading-6 text-muted">
              Индивидуальный пользователь не может подать заявку на партнерство без компании.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 break-words font-semibold text-ink">{value}</p>
    </div>
  );
}

function StatusBox({
  icon,
  title,
  text,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  tone: "success" | "warning" | "error";
}) {
  const color =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "error"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-700";
  return (
    <div className={`mt-4 rounded-2xl p-4 ${color}`}>
      <div className="flex items-center gap-2 font-semibold">
        {icon}
        {title}
      </div>
      <p className="mt-2 text-sm leading-6">{text}</p>
    </div>
  );
}
