import type { Course } from "@/entities/course/model/types";
import type { Intensive } from "@/entities/intensive/model/types";
import { apiRequest } from "@/shared/api/client";
import type { Session } from "@/shared/auth/session";
import { courseStatusLabel, intensiveStatusLabel, memberRoleLabel } from "@/shared/lib/labels";
import { navigate } from "@/shared/router";
import { StudioField } from "@/shared/ui/studio";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import {
  BookOpenCheck,
  Building2,
  CheckCircle2,
  Clock,
  FolderKanban,
  Mail,
  Plus,
  Send,
  Trophy,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type CompanyMember = {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  status: string;
  email?: string | null;
  fullName?: string | null;
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

export function CompanyPage({
  courses,
  intensives,
  session,
}: {
  courses: Course[];
  intensives: Intensive[];
  setCourses: (items: Course[]) => void;
  setIntensives: (items: Intensive[]) => void;
  session: Session | null;
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const isMainCompany = session?.user.role === "ADMIN";
  const companyCourses = useMemo(
    () =>
      courses.filter(
        (c) => isMainCompany || c.organizationId === session?.user.organizationId,
      ),
    [courses, isMainCompany, session],
  );
  const companyIntensives = useMemo(
    () =>
      intensives.filter(
        (i) => isMainCompany || i.organizationId === session?.user.organizationId,
      ),
    [intensives, isMainCompany, session],
  );
  const activeMembers = useMemo(() => members.filter((m) => m.status === "ACTIVE"), [members]);
  const pendingInvites = useMemo(() => invites.filter((i) => i.status === "PENDING"), [invites]);

  useEffect(() => {
    if (!session?.user.organizationId || isMainCompany) return;
    loadData();
  }, [session?.user.organizationId]);

  async function loadData() {
    if (!session?.user.organizationId) return;
    setLoadingMembers(true);
    try {
      const [nextMembers, nextInvites] = await Promise.all([
        apiRequest<CompanyMember[]>(`/api/organizations/${session.user.organizationId}/members`),
        apiRequest<Invite[]>(`/api/organizations/${session.user.organizationId}/invites`),
      ]);
      setMembers(nextMembers);
      setInvites(nextInvites);
    } catch {
      // silent
    } finally {
      setLoadingMembers(false);
    }
  }

  async function sendInvite() {
    if (sendingInvite) return;
    if (!inviteEmail.trim() || !session?.user.organizationId) {
      toastError("Укажите email сотрудника");
      return;
    }
    setSendingInvite(true);
    try {
      const created = await apiRequest<Invite>(
        `/api/organizations/${session.user.organizationId}/invites`,
        {
          method: "POST",
          body: JSON.stringify({ email: inviteEmail.trim(), message: inviteMessage.trim() || null }),
        },
      );
      setInvites((prev) => [created, ...prev]);
      setInviteEmail("");
      setInviteMessage("");
      toastSuccess(
        "Приглашение создано",
        `Сотруднику ${created.email} нужно войти в профиль и принять инвайт.`,
      );
    } catch (e) {
      toastError("Не удалось отправить приглашение", e instanceof Error ? e.message : undefined);
    } finally {
      setSendingInvite(false);
    }
  }

  return (
    <div className="grid gap-5">
      {/* Header */}
      <section className="rounded-3xl border border-line bg-white p-6 shadow-panel">
        <div className="flex items-center gap-3">
          <Building2 className="text-primary" size={24} />
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            {isMainCompany ? "Кабинет главной компании" : "Кабинет корпоративного клиента"}
          </h1>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          {isMainCompany
            ? "Главная компания управляет официальными курсами, интенсивами, партнерами и общей аналитикой платформы."
            : "Подключайте сотрудников через приглашения, назначайте обучение и отслеживайте результаты."}
        </p>
      </section>

      {/* Metrics */}
      <section className="grid gap-3 md:grid-cols-3">
        <Metric
          icon={<UsersRound size={20} />}
          label={isMainCompany ? "Организаций" : "Сотрудников"}
          value={isMainCompany ? "Все" : String(activeMembers.length)}
        />
        <Metric icon={<BookOpenCheck size={20} />} label="Курсов" value={String(companyCourses.length)} />
        <Metric icon={<CheckCircle2 size={20} />} label="Интенсивов" value={String(companyIntensives.length)} />
      </section>

      {/* Main content */}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid content-start gap-4">
          {/* Studio link */}
          <div className="rounded-3xl border border-line bg-white p-5 shadow-panel">
            <h2 className="text-lg font-semibold text-ink">Студия контента</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              Курсы и интенсивы создаются и редактируются в отдельном разделе.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <ActionCard
                icon={<FolderKanban size={20} />}
                title="Мои курсы"
                text="Создание, редактирование, публикация и модерация курсов."
                onClick={() => navigate("/my-courses")}
              />
              <ActionCard
                icon={<Trophy size={20} />}
                title="Интенсивы компании"
                text="Просмотр программ, этапов и результатов интенсивов."
                onClick={() => navigate("/my-courses")}
              />
            </div>
          </div>

          {/* Invite section */}
          {!isMainCompany && (
            <div className="rounded-3xl border border-line bg-white p-5 shadow-panel">
              <div className="mb-4 flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-primary">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-ink">Пригласить сотрудника</h2>
                  <p className="text-[12px] text-muted">Инвайт появится в профиле пользователя</p>
                </div>
              </div>

              <div className="rounded-2xl bg-surface p-4">
                <div className="grid gap-3">
                  <StudioField label="Email сотрудника" value={inviteEmail} onChange={setInviteEmail} />
                  <label className="grid gap-1.5 text-sm font-medium text-ink">
                    Сообщение (необязательно)
                    <textarea
                      className="min-h-16 rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary"
                      placeholder="Добро пожаловать в команду!"
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                    />
                  </label>
                  <button
                    onClick={sendInvite}
                    disabled={sendingInvite || !inviteEmail.trim()}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-gradient px-5 text-sm font-semibold text-white shadow-red-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={15} />
                    {sendingInvite ? "Отправляю..." : "Отправить приглашение"}
                  </button>
                </div>
              </div>

              {pendingInvites.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-muted">
                    Ожидают принятия ({pendingInvites.length})
                  </p>
                  <div className="grid gap-2">
                    {pendingInvites.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center gap-3 rounded-xl border border-line bg-amber-50/50 p-3"
                      >
                        <Mail size={14} className="shrink-0 text-amber-600" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-ink">{inv.email}</p>
                          <p className="text-[11px] text-muted flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(inv.createdAt).toLocaleDateString("ru-RU")}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          Ожидание
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isMainCompany && (
            <div className="rounded-3xl border border-line bg-white p-5 shadow-panel">
              <FolderKanban className="text-primary" size={20} />
              <h2 className="mt-3 text-lg font-semibold text-ink">Администрирование</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Партнерские заявки, пользователи и организации — в административной панели.
              </p>
              <button
                onClick={() => navigate("/admin")}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-medium text-white"
              >
                Открыть администрирование
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="grid content-start gap-4">
          <div className="rounded-3xl border border-line bg-white p-5 shadow-panel">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-primary">
                <Users size={17} />
              </div>
              <h2 className="text-[15px] font-semibold text-ink">
                {isMainCompany ? "Управление" : `Сотрудники (${activeMembers.length})`}
              </h2>
            </div>
            {isMainCompany ? (
              <p className="rounded-2xl bg-surface p-3 text-[13px] text-muted">
                Сотрудники управляются внутри кабинетов конкретных компаний.
              </p>
            ) : loadingMembers ? (
              <p className="rounded-2xl bg-surface p-3 text-[13px] text-muted">Загрузка...</p>
            ) : activeMembers.length === 0 ? (
              <p className="rounded-2xl bg-surface p-3 text-[13px] text-muted">
                Сотрудники появятся после принятия инвайтов.
              </p>
            ) : (
              <div className="grid gap-2">
                {activeMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-light text-[12px] font-bold text-primary">
                      {(member.fullName || member.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">
                        {member.fullName || "Сотрудник"}
                      </p>
                      {member.email && (
                        <p className="truncate text-[11px] text-muted">{member.email}</p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-muted">
                      {memberRoleLabel(member.role)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-line bg-white p-5 shadow-panel">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-primary">
                <Trophy size={17} />
              </div>
              <h2 className="text-[15px] font-semibold text-ink">Интенсивы</h2>
            </div>
            {companyIntensives.length === 0 ? (
              <p className="rounded-2xl bg-surface p-3 text-[13px] text-muted">
                Интенсивы появятся после создания.
              </p>
            ) : (
              <div className="grid gap-2">
                {companyIntensives.slice(0, 5).map((intensive) => (
                  <button
                    key={intensive.id}
                    onClick={() => navigate(`/intensives/${intensive.id}`)}
                    className="rounded-xl border border-line p-3 text-left transition hover:border-red-200"
                  >
                    <p className="text-[13px] font-semibold text-ink">{intensive.title}</p>
                    <p className="mt-1 text-[11px] text-muted">
                      {intensiveStatusLabel(intensive.status)} · лимит {intensive.participantLimit}
                    </p>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => navigate("/my-courses")}
              className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-line text-[13px] font-medium text-ink transition hover:border-primary hover:text-primary"
            >
              <Plus size={14} />
              Создать интенсив
            </button>
          </div>
        </aside>
      </section>

      {!isMainCompany && companyCourses.length > 0 && (
        <section className="rounded-3xl border border-line bg-white p-5 shadow-panel">
          <h2 className="mb-4 text-lg font-semibold text-ink">Курсы компании</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {companyCourses.slice(0, 6).map((course) => (
              <button
                key={course.id}
                onClick={() => navigate(`/courses/${course.id}`)}
                className="rounded-2xl border border-line p-4 text-left transition hover:border-red-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-ink">{course.title}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      course.status === "PUBLISHED"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-surface text-muted"
                    }`}
                  >
                    {courseStatusLabel(course.status)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-muted">{course.description}</p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ActionCard({
  icon,
  title,
  text,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-red-200 hover:bg-red-50/30"
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-primary shadow-sm">
        {icon}
      </div>
      <h3 className="mt-3 text-[14px] font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-[12px] leading-5 text-muted">{text}</p>
    </button>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-line bg-white p-5 shadow-panel">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-primary">{icon}</div>
      <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-[13px] text-muted">{label}</p>
    </article>
  );
}
