import type { Course } from "@/entities/course/model/types";
import type { Intensive } from "@/entities/intensive/model/types";
import { hasRole, type Role, type Session } from "@/shared/auth/session";
import { intensiveStatusLabel } from "@/shared/lib/labels";
import { navigate } from "@/shared/router";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  Flame,
  GraduationCap,
  Handshake,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserCog,
  UserPlus,
  UsersRound,
  Zap,
} from "lucide-react";

export type PlatformStats = {
  users: number;
  organizations: number;
  courses: number;
  publicCourses: number;
  companyCourses: number;
  intensives: number;
  partnerRequests: number;
};

export function HomePage({
  courses,
  intensives,
  stats,
  session,
}: {
  courses: Course[];
  intensives: Intensive[];
  stats: PlatformStats;
  session: Session | null;
}) {
  const actionCards = [
    { title: "Мое обучение", text: "Курсы, интенсивы, прогресс и сертификаты.", Icon: BookOpen, path: "/dashboard", roles: ["STUDENT", "CORPORATE_STUDENT"] as Role[] },
    { title: "Корпоративный кабинет", text: "Сотрудники, группы и назначение курсов.", Icon: UsersRound, path: "/company", roles: ["ADMIN"] as Role[] },
    { title: "Кабинет партнера", text: "Партнерские материалы, участники и аналитика.", Icon: Building2, path: "/partner", roles: ["PARTNER_MANAGER"] as Role[] },
    { title: "Проверка заданий", text: "Наставники проверяют этапы интенсивов.", Icon: UserCog, path: "/mentor", roles: ["MENTOR"] as Role[] },
    { title: "Администрирование", text: "Пользователи, организации, модерация.", Icon: ShieldCheck, path: "/admin", roles: ["ADMIN"] as Role[] },
  ].filter((card) => hasRole(session, card.roles));

  const publicActions = session
    ? actionCards
    : [
        { title: "Регистрация пользователя", text: "Создайте аккаунт и проходите открытые курсы и интенсивы платформы.", Icon: UserPlus, path: "/register" },
        { title: "Зарегистрировать компанию", text: "Создайте компанию, станьте менеджером и подайте заявку на партнерство.", Icon: Handshake, path: "/company-register" },
      ];

  const statsCards = [
    { label: "Пользователей", value: stats.users, Icon: UsersRound },
    { label: "Компаний", value: stats.organizations, Icon: Building2 },
    { label: "Курсов", value: stats.courses, Icon: BookOpen },
    { label: "Интенсивов", value: stats.intensives, Icon: Trophy },
  ];

  const visibleIntensives = intensives.filter((i) => i.status !== "HIDDEN" && i.status !== "DRAFT");

  return (
    <div className="grid gap-6">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-3xl bg-hero-gradient shadow-hero">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[10%] top-[20%] h-64 w-64 rounded-full bg-primary/20 blur-[80px]" />
          <div className="absolute right-[15%] top-[10%] h-48 w-48 rounded-full bg-red-800/20 blur-[60px]" />
          <div className="absolute bottom-0 left-[40%] h-40 w-96 rounded-full bg-primary/10 blur-[60px]" />
        </div>

        <div className="relative grid gap-6 p-5 sm:gap-8 sm:p-6 xl:grid-cols-[1fr_380px] xl:p-10">
          <div className="animate-slide-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm">
              <Sparkles size={12} className="text-primary" />
              Образовательная платформа РедСофт
            </span>
            <h1 className="mt-4 text-[28px] font-bold leading-[1.15] tracking-tight text-white sm:mt-5 sm:text-4xl md:text-5xl xl:text-[52px] xl:leading-[1.1]">
              Учитесь. Растите.{" "}
              <span className="text-gradient">Становитесь лучше.</span>
            </h1>
            <p className="mt-3 max-w-xl text-[14px] leading-6 text-white/60 sm:mt-4 sm:text-base sm:leading-7">
              Единая LMS для индивидуальных пользователей, корпоративных клиентов, партнёрских программ
              и трёхэтапных интенсивов с проверкой заданий наставниками.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-7 sm:gap-3">
              <button
                onClick={() => navigate(session ? "/dashboard" : "/register")}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-gradient px-4 text-[13px] font-semibold text-white shadow-hero transition hover:opacity-90 sm:h-12 sm:px-6 sm:text-[14px]"
              >
                {session ? "Открыть обучение" : "Начать бесплатно"}
                <ArrowUpRight size={15} />
              </button>
              <button
                onClick={() => navigate("/courses")}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-4 text-[13px] font-medium text-white backdrop-blur-sm transition hover:bg-white/12 sm:h-12 sm:px-6 sm:text-[14px]"
              >
                Смотреть курсы
              </button>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4 sm:mt-8 sm:gap-5">
              {[{ icon: Star, text: "Проверенные курсы" }, { icon: Zap, text: "Быстрый старт" }, { icon: GraduationCap, text: "Сертификаты" }].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-white/50">
                  <Icon size={14} className="text-primary" />
                  <span className="text-xs font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-scale-in hidden xl:block">
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statsCards.map(({ label, value, Icon }) => (
          <article key={label} className="card-hover rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-light text-primary">
                <Icon size={18} />
              </div>
              <Flame size={13} className="text-muted/30" />
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-ink">
              {value > 0 ? value.toLocaleString("ru-RU") : "—"}
            </p>
            <p className="mt-1 text-[13px] text-muted">{label}</p>
          </article>
        ))}
      </section>

      {/* ── Course & Intensive Previews ── */}
      <section className="grid gap-5 xl:grid-cols-2">
        <PreviewPanel title="Курсы" icon={<BookOpen size={16} />} action="Все курсы" onAction={() => navigate("/courses")}>
          {courses.slice(0, 3).map((course) => (
            <button
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}`)}
              className="card-hover group rounded-2xl border border-line p-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="badge badge-red">{course.authorType === "MAIN_COMPANY" ? "Официальный" : "Партнёрский"}</span>
                    {course.courseType === "COMPANY" && <span className="badge badge-gray">Корпоративный</span>}
                  </div>
                  <h3 className="mt-2 text-[14px] font-semibold leading-5 text-ink">{course.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-muted">{course.description}</p>
                </div>
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-surface text-muted transition group-hover:border-red-200 group-hover:bg-primary-light group-hover:text-primary">
                  <ArrowUpRight size={14} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-[12px] text-muted">
                <span className="flex items-center gap-1"><Clock size={11} />{course.durationHours} ч</span>
              </div>
            </button>
          ))}
          {courses.length === 0 && (
            <div className="rounded-2xl bg-surface p-6 text-center">
              <BookOpen size={22} className="mx-auto text-muted/30" />
              <p className="mt-2 text-[13px] text-muted">Курсы скоро появятся</p>
            </div>
          )}
        </PreviewPanel>

        <PreviewPanel title="Интенсивы" icon={<Trophy size={16} />} action="Все интенсивы" onAction={() => navigate("/intensives")}>
          {visibleIntensives.slice(0, 3).map((intensive) => (
            <button
              key={intensive.id}
              onClick={() => navigate(`/intensives/${intensive.id}`)}
              className="card-hover group rounded-2xl border border-line p-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="badge badge-gray">{intensiveStatusLabel(intensive.status)}</span>
                  <h3 className="mt-2 text-[14px] font-semibold leading-5 text-ink">{intensive.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-muted">{intensive.description}</p>
                </div>
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-surface text-muted transition group-hover:border-red-200 group-hover:bg-primary-light group-hover:text-primary">
                  <ArrowUpRight size={14} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-[12px] text-muted">
                <span className="flex items-center gap-1"><UsersRound size={11} />Лимит: {intensive.participantLimit}</span>
                {intensive.startsAt && (
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(intensive.startsAt) > new Date()
                      ? `Старт ${new Date(intensive.startsAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}`
                      : "Идёт сейчас"}
                  </span>
                )}
              </div>
            </button>
          ))}
          {visibleIntensives.length === 0 && (
            <div className="rounded-2xl bg-surface p-6 text-center">
              <Trophy size={22} className="mx-auto text-muted/30" />
              <p className="mt-2 text-[13px] text-muted">Интенсивы скоро появятся</p>
            </div>
          )}
        </PreviewPanel>
      </section>

      {/* ── CTA cards ── */}
      {publicActions.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {publicActions.map(({ title, text, Icon, path }) => (
            <button
              key={title}
              onClick={() => navigate(path)}
              className="card-hover group rounded-2xl border border-line bg-white p-5 text-left shadow-card"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-light text-primary">
                <Icon size={20} />
              </div>
              <h2 className="mt-4 text-[15px] font-semibold text-ink">{title}</h2>
              <p className="mt-1.5 text-[13px] leading-5 text-muted">{text}</p>
              <div className="mt-4 flex items-center gap-1 text-[13px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Перейти <ArrowUpRight size={13} />
              </div>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}

function PreviewPanel({
  title,
  icon,
  action,
  onAction,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-light text-primary">{icon}</div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
        </div>
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] font-medium text-primary transition hover:bg-primary-light"
        >
          {action}
          <ArrowUpRight size={14} />
        </button>
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

// ── Hero Illustration — custom SVG dashboard mockup ──────────────────────────
function HeroIllustration() {
  return (
    <div className="relative select-none">
      {/* Floating glow behind card */}
      <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-white/6 backdrop-blur-xl">
        {/* Top bar */}
        <div className="flex items-center gap-2 border-b border-white/8 bg-white/4 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
          </div>
          <div className="mx-auto flex h-5 items-center rounded-md bg-white/8 px-3">
            <span className="text-[10px] text-white/40">редакадемия.рф</span>
          </div>
        </div>

        <div className="p-4">
          {/* Profile row */}
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/6 p-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-gradient text-[13px] font-bold text-white shadow-red-sm">
              М
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-white/90">Мария Студентова</p>
              <p className="text-[10px] text-white/40">Пользователь · 2 курса</p>
            </div>
            <div className="h-5 w-5 rounded-full bg-emerald-400/20 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
          </div>

          {/* Progress cards */}
          <div className="mb-3 grid gap-2">
            {[
              { title: "Python для начинающих", pct: 68, color: "bg-red-gradient" },
              { title: "React: продвинутый уровень", pct: 34, color: "bg-red-gradient" },
            ].map(({ title, pct, color }) => (
              <div key={title} className="rounded-xl bg-white/5 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-medium text-white/80 truncate pr-2">{title}</p>
                  <span className="shrink-0 text-[10px] font-bold text-white/50">{pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { v: "8", l: "Уроков" },
              { v: "2", l: "Курса" },
              { v: "1", l: "Серт." },
            ].map(({ v, l }) => (
              <div key={l} className="rounded-xl bg-white/5 py-2 text-center">
                <p className="text-[16px] font-bold text-white">{v}</p>
                <p className="text-[9px] text-white/40">{l}</p>
              </div>
            ))}
          </div>

          {/* Active intensive banner */}
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-4 w-4 rounded-md bg-red-gradient flex items-center justify-center">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <polygon points="2,1 7,4 2,7" fill="white" />
                </svg>
              </div>
              <p className="text-[11px] font-semibold text-white/90">Хакатон: ML и анализ данных</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/3 rounded-full bg-red-gradient" />
              </div>
              <span className="text-[9px] text-white/40">Этап 1/3</span>
            </div>
          </div>
        </div>

        {/* Floating notification bubble */}
        <div className="absolute -right-2 -top-2 flex items-center gap-2 rounded-2xl border border-white/12 bg-white/10 px-3 py-2 shadow-lg backdrop-blur-sm">
          <div className="h-5 w-5 rounded-full bg-emerald-400/20 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <p className="text-[10px] font-medium text-white/80">Сертификат получен!</p>
        </div>
      </div>
    </div>
  );
}
