import type { Intensive } from "@/entities/intensive/model/types";
import { apiRequest } from "@/shared/api/client";
import type { Session } from "@/shared/auth/session";
import { applicationStatusLabel, intensiveStatusLabel, participantStatusLabel, submissionStatusLabel } from "@/shared/lib/labels";
import { navigate } from "@/shared/router";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Filter,
  Github,
  LockKeyhole,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Timer,
  Trophy,
  UserRound,
  UsersRound,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { EmptyIntensivesIllustration } from "@/shared/ui/illustrations";

// ─── Intensives List ──────────────────────────────────────────────────────────

export function IntensivesPage({
  intensives,
  setIntensives,
  refetch,
  error,
  session,
}: {
  intensives: Intensive[];
  setIntensives: (items: Intensive[]) => void;
  refetch: () => void;
  error?: string;
  session: Session | null;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const visibleIntensives = intensives.filter((i) => {
    if (i.status === "HIDDEN" || i.status === "DRAFT") return false;
    if (statusFilter !== "ALL" && i.status !== statusFilter) return false;
    if (query && !`${i.title} ${i.description}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const hasFilters = Boolean(query || statusFilter !== "ALL");

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="grid gap-5">
      {/* Header */}
      <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        <div className="bg-hero-gradient p-6">
          <span className="badge badge-dark"><Trophy size={11} />Интенсивы</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Образовательные интенсивы</h1>
          <p className="mt-2 text-[14px] leading-6 text-white/60">
            Программы с набором участников, этапами, дедлайнами, проверкой наставниками и итоговым рейтингом.
          </p>
          <div className="mt-5 flex flex-wrap gap-4">
            {[{ icon: Zap, text: "3 этапа" }, { icon: UsersRound, text: "Командная работа" }, { icon: Trophy, text: "Рейтинг" }].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-white/50">
                <Icon size={14} className="text-primary" /><span className="text-xs font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Filters */}
        <div className="grid gap-3 border-t border-line p-4 sm:grid-cols-[1fr_180px_auto]">
          <label className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 transition focus-within:border-primary focus-within:bg-white">
            <Search className="shrink-0 text-muted" size={15} />
            <input
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted"
              placeholder="Найти интенсив..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery("")} className="shrink-0 text-muted hover:text-ink">
                <X size={13} />
              </button>
            )}
          </label>
          <select
            className="h-10 rounded-xl border border-line bg-surface px-3 text-[13px] text-ink outline-none transition focus:border-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Все статусы</option>
            <option value="REGISTRATION_OPEN">Открыта регистрация</option>
            <option value="ENROLLMENT_OPEN">Набор открыт</option>
            <option value="IN_PROGRESS">Идёт сейчас</option>
            <option value="COMPLETED">Завершён</option>
          </select>
          <div className="flex gap-2">
            {hasFilters && (
              <button
                onClick={() => { setQuery(""); setStatusFilter("ALL"); }}
                className="h-10 px-3 rounded-xl border border-line text-[13px] text-muted transition hover:border-primary hover:text-primary"
              >
                <Filter size={14} />
              </button>
            )}
            <button
              onClick={refetch}
              className="h-10 px-4 rounded-xl border border-line text-[13px] font-medium text-ink transition hover:border-primary hover:text-primary flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              <span className="hidden sm:inline">Обновить</span>
            </button>
          </div>
        </div>
        <div className="border-t border-line px-4 py-2">
          <span className="text-[12px] text-muted">{visibleIntensives.length} интенсив(ов)</span>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-primary">
          Каталог временно недоступен. Обновите страницу через минуту.
        </div>
      )}

      {/* Grid */}
      <section className="grid gap-4 xl:grid-cols-2">
        {visibleIntensives.map((intensive, i) => (
          <motion.div
            key={intensive.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07, ease: "easeOut" }}
          >
            <IntensiveCard intensive={intensive} now={now} session={session} />
          </motion.div>
        ))}
        {visibleIntensives.length === 0 && (
          <div className="col-span-full rounded-3xl border border-line bg-white px-8 pb-10 pt-8 text-center shadow-card xl:col-span-2">
            <EmptyIntensivesIllustration className="mx-auto h-auto w-56" />
            <p className="mt-2 text-[15px] font-semibold text-ink">Интенсивов пока нет</p>
            <p className="mt-1 text-[13px] text-muted">Следите за обновлениями — новые интенсивы появятся здесь</p>
          </div>
        )}
      </section>
    </div>
  );
}

function IntensiveCard({ intensive, now, session }: { intensive: Intensive; now: number; session: Session | null }) {
  const started = hasStarted(intensive.startsAt, now);
  const canApply = !session || canApplyToIntensive(session);

  return (
    <article className="card-hover group flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      {/* Cover / hero */}
      <div className="relative h-40 overflow-hidden">
        {intensive.coverUrl ? (
          <img src={intensive.coverUrl} alt={intensive.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-hero-gradient">
            <Trophy size={40} className="text-white/20" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        {/* Status badge */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
            {intensiveStatusLabel(intensive.status)}
          </span>
          {started && (
            <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] font-medium text-white/80 backdrop-blur-sm">
              Набор закрыт
            </span>
          )}
        </div>
        {/* Participant limit */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] text-white/90 backdrop-blur-sm">
          <UsersRound size={11} />
          {intensive.participantLimit} мест
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-[16px] font-bold leading-[1.35] tracking-tight text-ink">{intensive.title}</h2>
        <p className="mt-1.5 line-clamp-2 flex-1 text-[13px] leading-5 text-muted">{intensive.description}</p>

        {/* Timer */}
        {intensive.startsAt && (
          <div className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium ${started ? "bg-surface text-muted" : "bg-primary-light text-primary"}`}>
            <Timer size={14} className="shrink-0" />
            {startsInText(intensive.startsAt, now)}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-line p-4">
        <button
          onClick={() => navigate(`/intensives/${intensive.id}`)}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-line px-3 text-[13px] font-medium text-ink transition hover:border-primary hover:text-primary"
        >
          Подробнее
        </button>
        <button
          onClick={() => navigate(`/intensives/${intensive.id}`)}
          disabled={started || (Boolean(session) && !canApply)}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-red-gradient px-3 text-[13px] font-semibold text-white shadow-red-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-none disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none"
        >
          {started ? "Набор закрыт" : (Boolean(session) && !canApply) ? "Просмотр" : "Подать заявку"}
          {!started && !(Boolean(session) && !canApply) && <ArrowUpRight size={14} />}
        </button>
      </div>
    </article>
  );
}

// ─── Intensive Details ────────────────────────────────────────────────────────

export function IntensiveDetailsPage({ intensiveId, intensives, session }: { intensiveId: string; intensives: Intensive[]; session: Session | null }) {
  const catalogIntensive = intensives.find((item) => item.id === intensiveId);
  const [details, setDetails] = useState<IntensiveDetails | null>(null);
  const intensive = details?.intensive ?? catalogIntensive;
  const [githubUrl, setGithubUrl] = useState("");
  const [stageAnswers, setStageAnswers] = useState<Record<string, string>>({});
  const [activeStageId, setActiveStageId] = useState("");
  const [applying, setApplying] = useState(false);
  const [submittingStageId, setSubmittingStageId] = useState("");
  const [pendingApplicationId, setPendingApplicationId] = useState("");
  const [pendingParticipantId, setPendingParticipantId] = useState("");
  const [pendingReviewId, setPendingReviewId] = useState("");
  const [reviews, setReviews] = useState<Record<string, { score: string; comment: string }>>({});
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    apiRequest<IntensiveDetails>(`/api/intensives/${intensiveId}`)
      .then(setDetails)
      .catch(() => toastError("Не удалось загрузить программу интенсива", "Попробуйте обновить страницу."));
  }, [intensiveId]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (githubUrl || !session) return;
    const participantProfile = details?.rating.find((item) => item.userId === session.user.id)?.githubUrl;
    const applicationProfile = details?.applications?.find((item) => item.userId === session.user.id)?.githubUrl;
    if (participantProfile || applicationProfile) setGithubUrl(participantProfile || applicationProfile || "");
  }, [details, githubUrl, session]);

  useEffect(() => {
    const stages = details?.stages ?? [];
    if (!stages.length) return;
    if (!activeStageId || !stages.some((s) => s.id === activeStageId)) setActiveStageId(stages[0].id);
  }, [activeStageId, details?.stages]);

  async function loadDetails() {
    setDetails(await apiRequest<IntensiveDetails>(`/api/intensives/${intensiveId}`));
  }

  async function apply() {
    if (!session || !intensive) { navigate("/login"); return; }
    if (!canApplyToIntensive(session)) { toastError("Заявку подают только обычные пользователи"); return; }
    const regDeadline = intensive.registrationDeadline ?? intensive.startsAt;
    if (hasStarted(regDeadline, now)) { toastError("Набор закрыт", "Дедлайн регистрации прошёл."); return; }
    if (hasApplied || applying) return;
    setApplying(true);
    try {
      await apiRequest(`/api/intensives/${intensive.id}/apply`, {
        method: "POST",
        body: JSON.stringify({ userId: session.user.id, organizationId: session.user.organizationId ?? null, githubUrl: normalizeGithubProfile(githubUrl) }),
      });
      await loadDetails().catch(() => undefined);
      toastSuccess("Заявка отправлена", "GitHub-профиль привязан.");
    } catch (e) {
      toastError("Не удалось подать заявку", e instanceof Error ? e.message : undefined);
    } finally { setApplying(false); }
  }

  async function submitStage(stage: IntensiveStage) {
    if (submittingStageId) return;
    if (!session || !intensive) { navigate("/login"); return; }
    setSubmittingStageId(stage.id);
    try {
      await apiRequest(`/api/intensives/${intensive.id}/stages/${stage.id}/submissions`, {
        method: "POST",
        body: JSON.stringify({ userId: session.user.id, githubUrl: normalizeGithubProfile(githubUrl), answerText: stageAnswers[stage.id] ?? "" }),
      });
      toastSuccess("Решение отправлено", `Этап "${stage.title}" ушёл на проверку.`);
    } catch (e) {
      toastError("Не удалось отправить решение", e instanceof Error ? e.message : undefined);
    } finally { setSubmittingStageId(""); }
  }

  async function approveApplication(applicationId: string) {
    if (pendingApplicationId) return;
    setPendingApplicationId(applicationId);
    try {
      await apiRequest(`/api/intensives/applications/${applicationId}/approve`, { method: "POST" });
      await loadDetails();
      toastSuccess("Заявка одобрена");
    } catch (e) {
      toastError("Не удалось одобрить заявку", e instanceof Error ? e.message : undefined);
    } finally { setPendingApplicationId(""); }
  }

  async function rejectApplication(applicationId: string) {
    if (pendingApplicationId) return;
    setPendingApplicationId(applicationId);
    try {
      await apiRequest(`/api/intensives/applications/${applicationId}/reject`, { method: "POST" });
      await loadDetails();
      toastSuccess("Заявка отклонена");
    } catch (e) {
      toastError("Не удалось отклонить заявку", e instanceof Error ? e.message : undefined);
    } finally { setPendingApplicationId(""); }
  }

  async function removeParticipant(participantId: string) {
    if (pendingParticipantId) return;
    if (!session || !intensive) return;
    setPendingParticipantId(participantId);
    try {
      await apiRequest(`/api/intensives/${intensive.id}/participants/${participantId}/kick`, {
        method: "POST",
        body: JSON.stringify({ managerUserId: session.user.id, reason: "Исключён организатором" }),
      });
      await loadDetails();
      toastSuccess("Участник исключён");
    } catch (e) {
      toastError("Не удалось исключить участника", e instanceof Error ? e.message : undefined);
    } finally { setPendingParticipantId(""); }
  }

  async function reviewSubmission(submissionId: string) {
    if (pendingReviewId) return;
    const draft = reviews[submissionId] ?? { score: "100", comment: "" };
    setPendingReviewId(submissionId);
    try {
      await apiRequest(`/api/tasks/submissions/${submissionId}/review`, {
        method: "POST",
        body: JSON.stringify({ score: Number(draft.score) || 0, comment: draft.comment }),
      });
      await loadDetails();
      toastSuccess("Решение проверено", "Баллы участника обновлены.");
    } catch (e) {
      toastError("Не удалось сохранить оценку", e instanceof Error ? e.message : undefined);
    } finally { setPendingReviewId(""); }
  }

  if (!intensive) return <PageHeader title="Интенсив не найден" text="Проверьте ссылку или откройте каталог интенсивов." />;

  const participant = details?.rating.find((item) => item.userId === session?.user.id);
  const application = details?.applications?.find((item) => item.userId === session?.user.id);
  const isActiveParticipant = participant?.status === "ACTIVE";
  const isEliminated = participant?.status === "ELIMINATED";
  const hasApplied = Boolean(application && ["PENDING", "APPROVED"].includes(application.status));
  const canSeeTasks = Boolean(isActiveParticipant || session?.user.role === "MENTOR" || session?.user.role === "PARTNER_MANAGER" || session?.user.role === "ADMIN");
  const canSubmit = Boolean(isActiveParticipant && canApplyToIntensive(session!));
  const canManage = Boolean(session && intensive && canManageIntensive(session, intensive));
  const pendingApplications = (details?.applications ?? []).filter((item) => item.status === "PENDING");
  const decidedApplications = (details?.applications ?? []).filter((item) => item.status !== "PENDING");
  // Managers/admins/mentors see all stages; regular users only see stages that have opened.
  const visibleStages = (details?.stages ?? []).filter((s) =>
    canManage || canSeeTasks || new Date(s.startsAt).getTime() <= now
  );
  const nextStage = (details?.stages ?? []).find((s) => new Date(s.startsAt).getTime() > now);
  const activeStage = visibleStages.find((s) => s.id === activeStageId) ?? visibleStages[0];

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, ease: "easeOut" }} className="grid gap-5">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        {intensive.coverUrl && (
          <div className="relative h-48 w-full overflow-hidden">
            <img src={intensive.coverUrl} alt={intensive.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}
        <div className="bg-hero-gradient p-6">
          <button onClick={() => navigate("/intensives")} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/60 transition hover:text-white">
            <ChevronLeft size={15} />
            Все интенсивы
          </button>
          <div className="flex flex-wrap gap-1.5">
            <span className="badge badge-dark">{intensiveStatusLabel(intensive.status)}</span>
            <span className="badge badge-dark">Лимит: {intensive.participantLimit}</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">{intensive.title}</h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-white/60">{intensive.description}</p>
        </div>

        {/* Timer strip */}
        <div className="flex flex-wrap items-center gap-3 border-t border-line bg-surface px-5 py-3 text-[13px]">
          <span className="inline-flex items-center gap-2 text-muted">
            <CalendarClock size={15} />
            {startsInText(intensive.startsAt, now)}
          </span>
          {nextStage && (
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3 py-1 text-[12px] font-medium text-primary">
              <Clock size={13} />
              Следующий этап: {formatDuration(new Date(nextStage.startsAt).getTime() - now)}
            </span>
          )}
          {isEliminated && (
            <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-[12px] font-medium text-primary">
              <LockKeyhole size={13} />
              Вы исключены, повторная запись закрыта
            </span>
          )}
        </div>
      </section>

      {/* Main layout */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Stages */}
        <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
          <div className="grid gap-0 xl:grid-cols-[240px_minmax(0,1fr)]">
            {/* Stage list */}
            <div className="min-w-0 overflow-hidden border-b border-line bg-surface xl:border-b-0 xl:border-r">
              <div className="p-4">
                <h2 className="text-[13px] font-semibold text-ink">Программа</h2>
              </div>
              <div className="grid gap-1 px-2 pb-3">
                {visibleStages.map((stage) => {
                  const active = stage.id === activeStage?.id;
                  const open = isStageOpen(stage, now);
                  return (
                    <button
                      key={stage.id}
                      onClick={() => setActiveStageId(stage.id)}
                      className={`rounded-xl p-3 text-left transition ${active ? "bg-red-gradient text-white shadow-red-sm" : "hover:bg-primary-light hover:text-primary"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[10px] font-medium uppercase tracking-wide ${active ? "text-white/70" : "text-muted"}`}>Этап {stage.position}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${active ? "bg-white/15 text-white" : open ? "bg-emerald-50 text-emerald-700" : "bg-surface text-muted"}`}>
                          {open ? "открыт" : "скоро"}
                        </span>
                      </div>
                      <p className={`mt-1 text-[13px] font-semibold leading-snug ${active ? "text-white" : "text-ink"}`}>{stage.title}</p>
                      <p className={`mt-0.5 text-[11px] ${active ? "text-white/60" : "text-muted"}`}>{stageStatusText(stage, now)}</p>
                    </button>
                  );
                })}
                {!visibleStages.length && (
                  <p className="px-3 py-4 text-[13px] text-muted">Программа пока не заполнена</p>
                )}
              </div>
            </div>

            {/* Stage content */}
            <div className="min-w-0">
              {activeStage ? (
                <div className="grid min-h-[420px] p-5">
                  <div>
                    <p className="text-[12px] font-medium text-primary">Этап {activeStage.position} · {stageStatusText(activeStage, now)}</p>
                    <h2 className="mt-1.5 text-xl font-bold tracking-tight text-ink">{activeStage.title}</h2>
                    <p className="mt-2 text-[14px] leading-6 text-muted">{activeStage.description}</p>
                  </div>

                  {canSeeTasks && isStageOpen(activeStage, now) ? (
                    <div className="mt-5 rounded-2xl border border-line bg-surface p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Задание</p>
                      <h3 className="mt-2 text-[15px] font-semibold text-ink">{activeStage.taskTitle}</h3>
                      <p className="mt-2 text-[13px] leading-5 text-muted">{activeStage.taskDescription}</p>
                      {canSubmit && (
                        <div className="mt-4 grid gap-2.5">
                          <textarea
                            className="min-h-28 resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-[14px] outline-none transition focus:border-primary"
                            placeholder="Комментарий к решению, ветка, что проверять..."
                            value={stageAnswers[activeStage.id] ?? ""}
                            onChange={(e) => setStageAnswers({ ...stageAnswers, [activeStage.id]: e.target.value })}
                          />
                          <button
                            onClick={() => submitStage(activeStage)}
                            disabled={Boolean(submittingStageId)}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-gradient px-5 text-[13px] font-semibold text-white shadow-red-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Send size={15} />
                            {submittingStageId === activeStage.id ? "Отправляю..." : "Отправить решение"}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-dashed border-line bg-surface p-5">
                      <LockKeyhole size={18} className="shrink-0 text-muted" />
                      <p className="text-[13px] leading-5 text-muted">
                        {!canSeeTasks
                          ? "Задание доступно только зачисленным участникам."
                          : `Задание откроется через ${formatDuration(new Date(activeStage.startsAt).getTime() - now)}.`}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center p-8 text-[14px] text-muted">
                  Выберите этап слева
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Participation sidebar */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-light text-primary">
                <Trophy size={16} />
              </div>
              <h2 className="text-[15px] font-semibold text-ink">Участие</h2>
            </div>
            <p className="mt-3 text-[13px] leading-5 text-muted">
              Набор: {intensiveStatusLabel(intensive.status)}. Лимит: {intensive.participantLimit}.
              {intensive.registrationDeadline
                ? ` Регистрация до ${new Date(intensive.registrationDeadline).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}.`
                : " Регистрация закрывается в момент старта."}
            </p>

            {hasApplied && (
              <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-[13px] font-medium text-emerald-700">
                Заявка подана · {applicationStatusLabel(application?.status)}
              </div>
            )}

            <label className="mt-4 grid gap-1.5">
              <span className="text-[12px] font-semibold text-ink">GitHub-профиль</span>
              <span className="flex h-10 items-center gap-2 rounded-xl border border-line px-3 transition focus-within:border-primary">
                <Github className="shrink-0 text-muted" size={15} />
                <input className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" placeholder="https://github.com/username" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
              </span>
            </label>

            {(() => {
              const regDeadline = intensive.registrationDeadline ?? intensive.startsAt;
              const deadlinePassed = hasStarted(regDeadline, now);
              return (
                <button
                  onClick={apply}
                  disabled={Boolean((session && !canApplyToIntensive(session)) || deadlinePassed || isEliminated || hasApplied || applying)}
                  className="mt-4 h-11 w-full rounded-xl bg-red-gradient text-[13px] font-semibold text-white shadow-red-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-none disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none"
                >
                  {applying ? "Отправляю..." : hasApplied ? "Заявка подана" : isEliminated ? "Запись закрыта" : session && !canApplyToIntensive(session) ? "Только просмотр" : deadlinePassed ? "Набор закрыт" : "Подать заявку"}
                </button>
              );
            })()}
          </div>

          {/* Leaderboard preview */}
          {(details?.rating ?? []).length > 0 && (
            <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
              <h3 className="text-[13px] font-semibold text-ink">Рейтинг участников</h3>
              <div className="mt-3 grid gap-1.5">
                {(details?.rating ?? []).slice(0, 5).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2">
                    <span className={`text-[12px] font-bold ${i === 0 ? "text-yellow-500" : i === 1 ? "text-zinc-400" : i === 2 ? "text-amber-600" : "text-muted"}`}>#{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{p.fullName || p.email || "Участник"}</span>
                    <span className="text-[12px] font-semibold text-primary">{p.score} б</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Admin panel */}
      {canManage && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Applications + Submissions */}
          <section className="min-w-0 overflow-hidden rounded-3xl border border-line bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-primary" size={20} />
                <h2 className="text-lg font-semibold text-ink">Управление заявками</h2>
              </div>
              {pendingApplications.length > 0 && (
                <span className="badge badge-red">{pendingApplications.length} новых</span>
              )}
            </div>

            <div className="mt-4 grid gap-2.5">
              {pendingApplications.map((app) => (
                <div key={app.id} className="grid min-w-0 gap-3 rounded-2xl border border-line bg-surface p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <PersonSummary name={app.fullName} email={app.email} githubUrl={app.githubUrl} fallback="Кандидат" />
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => approveApplication(app.id)} disabled={Boolean(pendingApplicationId)} className="inline-flex h-9 items-center gap-2 rounded-xl bg-red-gradient px-3 text-[13px] font-semibold text-white shadow-red-sm disabled:cursor-not-allowed disabled:opacity-60">
                      <CheckCircle2 size={14} />
                      {pendingApplicationId === app.id ? "Одобряю..." : "Одобрить"}
                    </button>
                    <button onClick={() => rejectApplication(app.id)} disabled={Boolean(pendingApplicationId)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-[13px] font-medium text-primary disabled:cursor-not-allowed disabled:opacity-60">
                      <XCircle size={14} />
                      {pendingApplicationId === app.id ? "Отклоняю..." : "Отклонить"}
                    </button>
                  </div>
                </div>
              ))}
              {pendingApplications.length === 0 && (
                <p className="rounded-xl bg-surface p-4 text-[13px] text-muted">Новых заявок нет</p>
              )}
            </div>

            {decidedApplications.length > 0 && (
              <div className="mt-4 border-t border-line pt-4">
                <h3 className="text-[13px] font-semibold text-ink">История заявок</h3>
                <div className="mt-2 grid gap-1.5">
                  {decidedApplications.slice(0, 6).map((app) => (
                    <div key={app.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-[13px]">
                      <span className="font-medium text-ink">{app.fullName || app.email || "Кандидат"}</span>
                      <span className="badge badge-gray">{applicationStatusLabel(app.status)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submissions */}
            {(details?.submissions ?? []).length > 0 && (
              <div className="mt-4 border-t border-line pt-4">
                <h3 className="text-[13px] font-semibold text-ink">Решения на проверку</h3>
                <div className="mt-2 grid gap-3">
                  {(details?.submissions ?? []).map((submission) => {
                    const reviewed = submission.status === "REVIEWED";
                    const draft = reviews[submission.id] ?? { score: String(submission.score ?? 100), comment: submission.reviewerComment ?? "" };
                    return (
                      <div key={submission.id} className="grid gap-3 rounded-2xl border border-line bg-surface p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-ink">{submission.stageTitle || "Этап интенсива"}</p>
                            <PersonSummary name={submission.fullName} email={submission.email} githubUrl={submission.githubUrl} fallback="Участник" compact />
                          </div>
                          <span className={`badge ${reviewed ? "badge-green" : "badge-red"}`}>{submissionStatusLabel(submission.status)}</span>
                        </div>
                        {submission.answerText && <p className="rounded-xl bg-white p-3 text-[13px] leading-5 text-muted">{submission.answerText}</p>}
                        <div className="grid gap-2 sm:grid-cols-[100px_minmax(0,1fr)_auto]">
                          <input className="h-9 rounded-xl border border-line bg-white px-3 text-[13px] outline-none focus:border-primary" value={draft.score} onChange={(e) => setReviews({ ...reviews, [submission.id]: { ...draft, score: e.target.value } })} />
                          <input className="h-9 rounded-xl border border-line bg-white px-3 text-[13px] outline-none focus:border-primary" placeholder="Комментарий участнику" value={draft.comment} onChange={(e) => setReviews({ ...reviews, [submission.id]: { ...draft, comment: e.target.value } })} />
                          <button onClick={() => reviewSubmission(submission.id)} disabled={Boolean(pendingReviewId)} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-red-gradient px-3 text-[13px] font-semibold text-white shadow-red-sm disabled:cursor-not-allowed disabled:opacity-60">
                            <CheckCircle2 size={14} />
                            {pendingReviewId === submission.id ? "..." : "Оценить"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Participants */}
          <aside className="overflow-hidden rounded-3xl border border-line bg-white p-5 shadow-card">
            <div className="flex items-center gap-2">
              <UsersRound className="text-primary" size={18} />
              <h2 className="text-[15px] font-semibold text-ink">Участники ({(details?.rating ?? []).length})</h2>
            </div>
            <div className="mt-4 grid gap-2.5">
              {(details?.rating ?? []).map((p) => {
                const removed = p.status === "ELIMINATED";
                return (
                  <div key={p.id} className="overflow-hidden rounded-2xl border border-line">
                    <div className="p-3">
                      <PersonSummary name={p.fullName} email={p.email} githubUrl={p.githubUrl} fallback="Участник" compact />
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`badge ${removed ? "badge-red" : "badge-green"}`}>{participantStatusLabel(p.status)}</span>
                        <span className="text-[12px] font-semibold text-ink">{p.score} б</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeParticipant(p.id)}
                      disabled={removed || Boolean(pendingParticipantId)}
                      className="flex w-full items-center justify-center gap-2 border-t border-line bg-surface py-2 text-[12px] font-medium text-primary transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-muted"
                    >
                      <XCircle size={13} />
                      {pendingParticipantId === p.id ? "Исключаю..." : removed ? "Уже исключён" : "Исключить"}
                    </button>
                  </div>
                );
              })}
              {(details?.rating ?? []).length === 0 && (
                <p className="rounded-xl bg-surface p-4 text-[13px] text-muted">Участников пока нет. Одобрите первую заявку.</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </motion.div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type IntensiveDetails = {
  intensive: Intensive;
  stages: IntensiveStage[];
  rating: Array<{ id: string; userId: string; githubUrl?: string | null; score: number; status: string; email?: string | null; fullName?: string | null }>;
  applications?: Array<{ id: string; userId: string; githubUrl?: string | null; status: string; email?: string | null; fullName?: string | null }>;
  submissions?: Array<{ id: string; taskId: string; userId: string; githubUrl?: string | null; answerText?: string | null; status: string; score?: number | null; submittedAt: string; stageTitle?: string | null; email?: string | null; fullName?: string | null; reviewerComment?: string | null }>;
};

type IntensiveStage = {
  id: string; intensiveId: string; title: string; description: string;
  taskTitle: string; taskDescription: string; answerType: string;
  position: number; startsAt: string; endsAt: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PageHeader({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-8 shadow-card">
      <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
      <p className="mt-2 max-w-2xl text-[14px] leading-6 text-muted">{text}</p>
    </section>
  );
}

function PersonSummary({ name, email, githubUrl, fallback, compact = false }: { name?: string | null; email?: string | null; githubUrl?: string | null; fallback: string; compact?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface text-muted">
          <UserRound size={14} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-ink">{name || fallback}</p>
          {email && <p className="truncate text-[11px] text-muted">{email}</p>}
        </div>
      </div>
      {githubUrl && (
        <a className="mt-1.5 block truncate text-[12px] font-medium text-primary" href={normalizeGithubProfile(githubUrl)} target="_blank" rel="noreferrer">
          GitHub: {githubUsername(githubUrl)}
        </a>
      )}
    </div>
  );
}

function canApplyToIntensive(session: Session) {
  return session.user.role === "STUDENT" || session.user.role === "CORPORATE_STUDENT";
}

function normalizeGithubProfile(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withoutProtocol = trimmed.replace(/^https?:\/\//, "").replace(/^www\./, "");
  if (withoutProtocol.startsWith("github.com/")) {
    const username = withoutProtocol.slice("github.com/".length).split(/[/?#]/)[0];
    return username ? `https://github.com/${username}` : trimmed;
  }
  const username = withoutProtocol.replace(/^@/, "").split(/[/?#]/)[0];
  return username ? `https://github.com/${username}` : trimmed;
}

function githubUsername(value: string) {
  return normalizeGithubProfile(value).replace(/^https:\/\/github\.com\//, "@");
}

function canManageIntensive(session: Session, intensive: Intensive) {
  if (session.user.role === "ADMIN") return true;
  if (!session.user.organizationId || session.user.organizationId !== intensive.organizationId) return false;
  if (session.user.role === "PARTNER_MANAGER" && intensive.organizerType === "PARTNER") return true;
  return false;
}

function hasStarted(startsAt: string | undefined, now: number) {
  return Boolean(startsAt && now >= new Date(startsAt).getTime());
}

function startsInText(startsAt: string | undefined, now: number) {
  if (!startsAt) return "Дата старта не указана";
  const diff = new Date(startsAt).getTime() - now;
  return diff > 0 ? `Старт через ${formatDuration(diff)}` : "Интенсив уже начался";
}

function isStageOpen(stage: IntensiveStage, now: number) {
  return now >= new Date(stage.startsAt).getTime();
}

function stageStatusText(stage: IntensiveStage, now: number) {
  const diff = new Date(stage.startsAt).getTime() - now;
  return diff > 0 ? `откроется через ${formatDuration(diff)}` : "открыт";
}

function formatDuration(ms: number) {
  if (ms <= 0) return "0 сек";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days} д ${hours} ч ${minutes} мин`;
  if (hours > 0) return `${hours} ч ${minutes} мин ${seconds} сек`;
  if (minutes > 0) return `${minutes} мин ${seconds} сек`;
  return `${seconds} сек`;
}
