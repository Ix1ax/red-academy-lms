import type { Course } from "@/entities/course/model/types";
import type { Intensive } from "@/entities/intensive/model/types";
import { Component, type ReactNode } from "react";
import { AdminPage } from "@/pages/admin";
import { AuthPage, type RegisterKind } from "@/pages/auth";
import { CompanyPage } from "@/pages/company";
import { CourseEditorPage, IntensiveEditorPage, MyCoursesPage } from "@/pages/content-studio";
import { CourseDetailsPage, CoursePreviewPage, CoursesPage } from "@/pages/courses";
import { DashboardPage } from "@/pages/dashboard";
import { HomePage, type PlatformStats } from "@/pages/home";
import { IntensiveDetailsPage, IntensivesPage } from "@/pages/intensives";
import { MentorPage } from "@/pages/mentor";
import { PartnerPage } from "@/pages/partner";
import { PrivacyPage } from "@/pages/privacy";
import { ProfilePage } from "@/pages/profile";
import { useApiData } from "@/shared/api/use-api-data";
import { hasRole, loadSession, persistSession, roleLabels, type Role, type Session } from "@/shared/auth/session";
import { navigate, routeParam, useRoute } from "@/shared/router";
import { ToastViewport } from "@/shared/ui/toast";
import {
  BookOpen,
  Building2,
  ChevronRight,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Library,
  LockKeyhole,
  LogIn,
  LogOut,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserCog,
  UserPlus,
  UserRound,
  UsersRound,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="max-w-lg rounded-3xl border border-red-200 bg-white p-8 shadow-panel">
            <h1 className="text-xl font-bold text-primary">Что-то пошло не так</h1>
            <p className="mt-2 text-sm text-muted">Произошла ошибка при отображении страницы. Попробуйте обновить или перейти на другую страницу.</p>
            <pre className="mt-4 overflow-auto rounded-xl bg-surface p-4 text-xs text-ink">{String(this.state.error)}</pre>
            <button onClick={() => { this.setState({ error: null }); window.location.href = "/"; }} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white">
              На главную
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

const navItems: Array<{ path: string; label: string; icon: typeof LayoutDashboard; roles?: Role[] }> = [
  { path: "/", label: "Главная", icon: LayoutDashboard },
  { path: "/courses", label: "Курсы", icon: Library },
  { path: "/intensives", label: "Интенсивы", icon: Trophy },
  { path: "/profile", label: "Профиль", icon: UserRound, roles: ["STUDENT", "CORPORATE_STUDENT", "PARTNER_MANAGER", "MENTOR", "ADMIN"] },
  { path: "/dashboard", label: "Мое обучение", icon: BookOpen, roles: ["STUDENT", "CORPORATE_STUDENT"] },
  { path: "/my-courses", label: "Мои курсы", icon: FolderKanban, roles: ["PARTNER_MANAGER", "ADMIN"] },
  { path: "/company", label: "Компания", icon: Building2, roles: ["ADMIN"] },
  { path: "/partner", label: "Партнер", icon: UsersRound, roles: ["PARTNER_MANAGER"] },
  { path: "/mentor", label: "Наставник", icon: UserCog, roles: ["MENTOR"] },
  { path: "/admin", label: "Админ", icon: ShieldCheck, roles: ["ADMIN"] },
];

const emptyStats: PlatformStats = {
  users: 0,
  organizations: 0,
  courses: 0,
  publicCourses: 0,
  companyCourses: 0,
  intensives: 0,
  partnerRequests: 0,
};

export function App() {
  return <ErrorBoundary><AppInner /></ErrorBoundary>;
}

function AppInner() {
  const { path } = useRoute();
  const [session, setSessionState] = useState<Session | null>(() => loadSession());
  const coursePath = session?.user.organizationId ? `/api/courses?organizationId=${session.user.organizationId}` : "/api/courses";
  const coursesState = useApiData<Course[]>(coursePath, []);
  const intensivesState = useApiData<Intensive[]>("/api/intensives", []);
  const statsState = useApiData<PlatformStats>("/api/organizations/platform-stats", emptyStats);

  const setSession = (next: Session | null) => {
    persistSession(next);
    setSessionState(next);
  };

  // Refresh session user data on app start to pick up role/org changes made by admin
  useEffect(() => {
    const stored = loadSession();
    if (!stored) return;
    fetch("/api/users/me", {
      headers: { Authorization: `Bearer ${stored.accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => {
        if (!user) return;
        const refreshed: Session = {
          ...stored,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            organizationId: user.organizationId ?? null,
          },
        };
        // Only update if something actually changed
        if (
          stored.user.role !== refreshed.user.role ||
          stored.user.organizationId !== refreshed.user.organizationId ||
          stored.user.fullName !== refreshed.user.fullName
        ) {
          setSession(refreshed);
        }
      })
      .catch(() => {/* silent — offline / token expired */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const courseId = routeParam(path, "/courses/");
  const intensiveId = routeParam(path, "/intensives/");

  const page = useMemo(() => {
    if (path === "/") {
      return <HomePage courses={coursesState.data} intensives={intensivesState.data} stats={statsState.data} session={session} />;
    }

    if (path === "/login" || path === "/register" || path === "/company-register" || path === "/partner-request") {
      const initialKind: RegisterKind = path === "/company-register" || path === "/partner-request" ? "company" : "user";
      return <AuthPage mode={path === "/login" ? "login" : "register"} initialKind={initialKind} onSessionChange={setSession} />;
    }

    if (path === "/courses") {
      return <CoursesPage courses={coursesState.data} setCourses={coursesState.setData} refetch={coursesState.refetch} error={coursesState.error} session={session} />;
    }

    if (courseId) {
      // /courses/{id}/learn → learning interface; /courses/{id} → preview/landing
      if (path === `/courses/${courseId}/learn`) {
        return <CourseDetailsPage courseId={courseId} courses={coursesState.data} session={session} />;
      }
      return <CoursePreviewPage courseId={courseId} courses={coursesState.data} session={session} />;
    }

    if (path === "/intensives") {
      return <IntensivesPage intensives={intensivesState.data} setIntensives={intensivesState.setData} refetch={intensivesState.refetch} error={intensivesState.error} session={session} />;
    }

    if (intensiveId) {
      return <IntensiveDetailsPage intensiveId={intensiveId} intensives={intensivesState.data} session={session} />;
    }

    if (path === "/dashboard") {
      return (
        <Protected roles={["STUDENT", "CORPORATE_STUDENT"]} session={session}>
          <DashboardPage courses={coursesState.data} intensives={intensivesState.data} session={session} />
        </Protected>
      );
    }

    if (path === "/profile") {
      return (
        <Protected roles={["STUDENT", "CORPORATE_STUDENT", "PARTNER_MANAGER", "MENTOR", "ADMIN"]} session={session}>
          <ProfilePage session={session} onSessionChange={setSession} />
        </Protected>
      );
    }

    if (path === "/privacy") {
      return <PrivacyPage />;
    }

    if (path === "/my-courses") {
      return (
        <Protected roles={["PARTNER_MANAGER", "ADMIN"]} session={session}>
          <MyCoursesPage session={session} courses={coursesState.data} intensives={intensivesState.data} setCourses={coursesState.setData} setIntensives={intensivesState.setData} />
        </Protected>
      );
    }

    if (path === "/my-courses/courses/new") {
      return (
        <Protected roles={["PARTNER_MANAGER", "ADMIN"]} session={session}>
          <CourseEditorPage owner={ownerForSession(session)} session={session} courses={coursesState.data} setCourses={coursesState.setData} />
        </Protected>
      );
    }

    const courseEditId = routeParam(path, "/my-courses/courses/");
    if (courseEditId && path.endsWith("/edit")) {
      return (
        <Protected roles={["PARTNER_MANAGER", "ADMIN"]} session={session}>
          <CourseEditorPage owner={ownerForSession(session)} session={session} courseId={courseEditId} courses={coursesState.data} setCourses={coursesState.setData} />
        </Protected>
      );
    }

    if (path === "/my-courses/intensives/new") {
      return (
        <Protected roles={["PARTNER_MANAGER", "ADMIN"]} session={session}>
          <IntensiveEditorPage owner={ownerForSession(session)} session={session} intensives={intensivesState.data} setIntensives={intensivesState.setData} />
        </Protected>
      );
    }

    const intensiveEditId = routeParam(path, "/my-courses/intensives/");
    if (intensiveEditId && path.endsWith("/edit")) {
      return (
        <Protected roles={["PARTNER_MANAGER", "ADMIN"]} session={session}>
          <IntensiveEditorPage owner={ownerForSession(session)} session={session} intensiveId={intensiveEditId} intensives={intensivesState.data} setIntensives={intensivesState.setData} />
        </Protected>
      );
    }

    if (
      path === "/company/courses/new" ||
      path === "/company/intensives/new" ||
      path === "/partner/courses/new" ||
      path === "/partner/intensives/new"
    ) {
      return <MovedToStudio />;
    }

    if (path === "/company") {
      return (
        <Protected roles={["ADMIN"]} session={session}>
          <CompanyPage courses={coursesState.data} intensives={intensivesState.data} setCourses={coursesState.setData} setIntensives={intensivesState.setData} session={session} />
        </Protected>
      );
    }

    if (path === "/partner") {
      return (
        <Protected roles={["PARTNER_MANAGER"]} session={session}>
          <PartnerPage courses={coursesState.data} intensives={intensivesState.data} setCourses={coursesState.setData} setIntensives={intensivesState.setData} session={session} />
        </Protected>
      );
    }

    if (path === "/mentor") {
      return (
        <Protected roles={["MENTOR"]} session={session}>
          <MentorPage session={session} intensives={intensivesState.data} />
        </Protected>
      );
    }

    if (path === "/admin") {
      return (
        <Protected roles={["ADMIN"]} session={session}>
          <AdminPage courses={coursesState.data} intensives={intensivesState.data} session={session} />
        </Protected>
      );
    }

    return <NotFound />;
  }, [courseId, coursesState, intensiveId, intensivesState, path, session, statsState.data]);

  const isAuthPage = ["/login", "/register", "/company-register", "/partner-request"].includes(path);

  if (isAuthPage) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <ToastViewport />
        <AnimatePresence mode="wait">
          <motion.div key={path} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {page}
          </motion.div>
        </AnimatePresence>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <ToastViewport />
      <AppHeader session={session} onSessionChange={setSession} activePath={path} />
      <div className="mx-auto grid w-full max-w-[1440px] gap-5 px-3 py-4 pb-24 sm:px-5 sm:py-6 sm:pb-6 lg:grid-cols-[228px_minmax(0,1fr)] xl:grid-cols-[248px_minmax(0,1fr)]">
        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden lg:block">
          <AppNav session={session} activePath={path} />
        </div>
        <AnimatePresence mode="wait">
          <motion.section
            key={path}
            className="min-w-0"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {page}
          </motion.section>
        </AnimatePresence>
      </div>
      {/* Mobile bottom navigation */}
      <MobileNav session={session} activePath={path} />
    </main>
  );
}

function AppHeader({
  session,
  onSessionChange,
  activePath,
}: {
  session: Session | null;
  onSessionChange: (session: Session | null) => void;
  activePath: string;
}) {
  const accountLabel = session?.user.role === "ADMIN" ? "РедАкадемия" : session?.user.fullName;

  return (
    <header className="sticky top-0 z-30 border-b border-line glass">
      <div className="mx-auto flex min-h-[56px] max-w-[1440px] items-center justify-between gap-2 px-3 py-2 sm:min-h-[60px] sm:gap-3 sm:px-5 sm:py-3">
        <button onClick={() => navigate("/")} className="group flex items-center gap-0 text-left">
          {/* Badge block */}
          <div className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-red-gradient shadow-red-sm transition-all group-hover:shadow-glow sm:h-10 sm:w-10">
            <span className="text-[15px] font-extrabold leading-none tracking-tighter text-white sm:text-[17px]">РЕД</span>
          </div>
          {/* Name */}
          <div className="pl-2.5 sm:pl-3">
            <p className="text-[14px] font-bold leading-none tracking-tight text-ink sm:text-[16px]">
              Академия
            </p>
            <p className="mt-0.5 hidden text-[11px] font-medium tracking-wide text-muted sm:block">Образовательная платформа</p>
          </div>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {session ? (
            <>
              <div className="hidden items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 sm:flex">
                <div className="grid h-6 w-6 place-items-center rounded-lg bg-primary-light text-primary">
                  <UserRound size={13} />
                </div>
                <span className="text-[13px] font-medium text-ink">{accountLabel}</span>
                <span className="text-[13px] text-muted">·</span>
                <span className="text-[13px] text-muted">{roleLabels[session.user.role]}</span>
              </div>
              {/* Mobile: show role chip */}
              <div className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-2 py-1.5 sm:hidden">
                <div className="grid h-5 w-5 place-items-center rounded-md bg-primary-light text-primary">
                  <UserRound size={11} />
                </div>
                <span className="text-[12px] font-medium text-ink">{roleLabels[session.user.role]}</span>
              </div>
              <button
                onClick={() => onSessionChange(null)}
                className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-ink px-2.5 text-[12px] font-medium text-white transition-opacity hover:opacity-80 sm:h-9 sm:gap-2 sm:px-3 sm:text-[13px]"
              >
                <LogOut size={13} />
                <span className="hidden xs:inline sm:inline">Выйти</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/register")}
                className="hidden h-9 items-center gap-2 rounded-xl border border-line bg-white px-3 text-[13px] font-medium text-ink transition hover:border-red-200 hover:text-primary sm:inline-flex"
              >
                <UserPlus size={14} />
                Регистрация
              </button>
              <button
                onClick={() => navigate("/login")}
                className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-red-gradient px-2.5 text-[12px] font-medium text-white shadow-red-sm transition hover:opacity-90 sm:h-9 sm:gap-2 sm:px-3 sm:text-[13px]"
              >
                <LogIn size={13} />
                Войти
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function AppNav({ session, activePath }: { session: Session | null; activePath: string }) {
  const visibleItems = navItems.filter((item) => hasRole(session, item.roles));

  return (
    <aside className="sticky top-[72px] self-start">
      <nav className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="grid gap-0.5 p-2">
          {visibleItems.map((item) => {
            const active = item.path === "/" ? activePath === "/" : activePath.startsWith(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`group flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-all ${
                  active ? "bg-red-gradient text-white shadow-red-sm" : "text-muted hover:bg-primary-light hover:text-primary"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                <span className="truncate">{item.label}</span>
                {active && <ChevronRight size={13} className="ml-auto shrink-0 opacity-60" />}
              </button>
            );
          })}
        </div>

        {!session && (
          <div className="m-2 mt-0 rounded-xl bg-primary-light p-3">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles size={13} />
              <span className="text-xs font-semibold">Войдите для полного доступа</span>
            </div>
            <p className="mt-1 text-[11px] leading-4 text-primary/70">Курсы, прогресс, сертификаты</p>
          </div>
        )}
      </nav>
    </aside>
  );
}

// Mobile bottom navigation — visible only on small screens (< lg)
function MobileNav({ session, activePath }: { session: Session | null; activePath: string }) {
  // Show the 5 most important nav items for the current user
  const allVisible = navItems.filter((item) => hasRole(session, item.roles));

  // Priority: main items first, then role-specific, cap at 5
  const priority = ["/", "/courses", "/intensives", "/dashboard", "/my-courses", "/admin", "/company", "/partner", "/profile", "/mentor"];
  const mobileItems = priority
    .map((p) => allVisible.find((item) => item.path === p))
    .filter(Boolean)
    .slice(0, 5) as typeof navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-white/95 backdrop-blur-md lg:hidden">
      <div className="grid h-16 grid-cols-5 px-1">
        {mobileItems.map((item) => {
          const active = item.path === "/" ? activePath === "/" : activePath.startsWith(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                active ? "text-primary" : "text-muted"
              }`}
            >
              <div className={`grid h-8 w-8 place-items-center rounded-xl transition-all ${active ? "bg-primary-light" : ""}`}>
                <Icon size={18} />
              </div>
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
      {/* Safe area spacer for phones with home indicator */}
      <div className="h-safe-bottom" />
    </nav>
  );
}

function ownerForSession(session: Session | null) {
  if (session?.user.role === "ADMIN") return "MAIN_COMPANY" as const;
  return "PARTNER" as const;
}

function Protected({ roles, session, children }: { roles: Role[]; session: Session | null; children: React.ReactNode }) {
  if (!session) {
    return (
      <AccessState
        title="Нужна авторизация"
        text="Эта страница относится к личному кабинету. Войдите в аккаунт или зарегистрируйтесь."
        action="Войти"
        onAction={() => navigate("/login")}
      />
    );
  }

  if (!hasRole(session, roles)) {
    return (
      <AccessState
        title="Недостаточно прав"
        text={`Текущая роль: ${roleLabels[session.user.role]}. Для этой страницы нужна другая роль.`}
        action="На главную"
        onAction={() => navigate("/")}
      />
    );
  }

  return <>{children}</>;
}

function AccessState({ title, text, action, onAction }: { title: string; text: string; action: string; onAction: () => void }) {
  return (
    <section className="animate-slide-up overflow-hidden rounded-3xl border border-line bg-white p-8 shadow-panel">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-light text-primary">
        <LockKeyhole size={24} />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink">{title}</h1>
      <p className="mt-3 max-w-lg text-[15px] leading-7 text-muted">{text}</p>
      <button
        onClick={onAction}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-red-gradient px-5 text-[13px] font-semibold text-white shadow-red-sm transition hover:opacity-90"
      >
        {action}
        <ChevronRight size={15} />
      </button>
    </section>
  );
}

function MovedToStudio() {
  return (
    <AccessState
      title="Создание перенесено"
      text='Курсы и интенсивы создаются через "Мои курсы" — отдельную рабочую страницу для контента.'
      action="Открыть Мои курсы"
      onAction={() => navigate("/my-courses")}
    />
  );
}

function NotFound() {
  return (
    <AccessState
      title="Страница не найдена"
      text="Такого раздела нет в карте платформы. Возможно, ссылка устарела."
      action="Вернуться на главную"
      onAction={() => navigate("/")}
    />
  );
}
