import type { Course } from "@/entities/course/model/types";
import { apiRequest } from "@/shared/api/client";
import type { Session } from "@/shared/auth/session";
import { courseStatusLabel, levelLabel } from "@/shared/lib/labels";
import { navigate } from "@/shared/router";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import {
  ArrowUpRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Filter,
  GraduationCap,
  Layers,
  Lock,
  PlayCircle,
  RefreshCw,
  Search,
  Signal,
  Trophy,
  X,
} from "lucide-react";
import { EmptyCoursesIllustration } from "@/shared/ui/illustrations";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

// ─── Courses List Page ────────────────────────────────────────────────────────

export function CoursesPage({
  courses,
  setCourses,
  refetch,
  error,
  session,
}: {
  courses: Course[];
  setCourses: (courses: Course[]) => void;
  refetch: () => void;
  error?: string;
  session: Session | null;
}) {
  const [query, setQuery] = useState("");
  const [author, setAuthor] = useState("ALL");
  const [courseType, setCourseType] = useState("ALL");
  const [level, setLevel] = useState("ALL");
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(() => new Set());
  const [enrollingCourseIds, setEnrollingCourseIds] = useState<Set<string>>(() => new Set());

  const filtered = useMemo(
    () =>
      courses.filter((course) => {
        const matchesQuery = `${course.title} ${course.description}`.toLowerCase().includes(query.toLowerCase());
        const matchesAuthor = author === "ALL" || course.authorType === author;
        const matchesType = courseType === "ALL" || course.courseType === courseType;
        const matchesLevel = level === "ALL" || course.level === level;
        return isCourseVisible(course, session) && matchesQuery && matchesAuthor && matchesType && matchesLevel;
      }),
    [author, courseType, courses, level, query, session],
  );

  const hasFilters = Boolean(query || author !== "ALL" || courseType !== "ALL" || level !== "ALL");

  useEffect(() => {
    if (!session) { setEnrolledCourseIds(new Set()); setEnrollingCourseIds(new Set()); return; }
    let cancelled = false;
    const org = session.user.organizationId ? `&organizationId=${session.user.organizationId}` : "";
    Promise.all(
      courses
        .filter((c) => isCourseVisible(c, session))
        .map(async (course) => {
          try {
            const p = await apiRequest<CourseProgress>(`/api/courses/${course.id}/progress?userId=${session.user.id}${org}`);
            return p.enrollmentStatus === "ACTIVE" || p.enrollmentStatus === "COMPLETED" ? course.id : null;
          } catch { return null; }
        }),
    ).then((ids) => { if (!cancelled) setEnrolledCourseIds(new Set(ids.filter(Boolean) as string[])); });
    return () => { cancelled = true; };
  }, [courses, session?.user.id, session?.user.organizationId]);

  async function enroll(courseId: string) {
    if (!session) { navigate("/login"); return; }
    if (enrolledCourseIds.has(courseId) || enrollingCourseIds.has(courseId)) return;
    setEnrollingCourseIds((c) => new Set(c).add(courseId));
    try {
      await apiRequest(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        body: JSON.stringify({ userId: session.user.id, organizationId: session.user.organizationId ?? null }),
      });
      setEnrolledCourseIds((c) => new Set(c).add(courseId));
      toastSuccess("Курс добавлен в личный кабинет");
    } catch (e) {
      toastError("Не удалось записаться на курс", e instanceof Error ? e.message : undefined);
    } finally {
      setEnrollingCourseIds((c) => { const n = new Set(c); n.delete(courseId); return n; });
    }
  }

  function resetFilters() { setQuery(""); setAuthor("ALL"); setCourseType("ALL"); setLevel("ALL"); }

  return (
    <div className="grid gap-5">
      {/* Header */}
      <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        <div className="bg-hero-gradient p-6">
          <span className="badge badge-dark">
            <BookOpen size={11} />
            Каталог курсов
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Все курсы платформы</h1>
          <p className="mt-2 text-[14px] leading-6 text-white/60">
            Официальные программы основной компании и партнёрские курсы для самостоятельного изучения.
          </p>
        </div>

        {/* Filters */}
        <div className="grid gap-2.5 p-4 sm:p-5 sm:gap-3 lg:grid-cols-[1fr_160px_160px_160px_auto]">
          <label className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 transition focus-within:border-primary focus-within:bg-white">
            <Search className="shrink-0 text-muted" size={16} />
            <input
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted"
              placeholder="Найти курс..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery("")} className="shrink-0 text-muted hover:text-ink">
                <X size={14} />
              </button>
            )}
          </label>
          <select className="h-10 rounded-xl border border-line bg-surface px-3 text-[13px] text-ink outline-none transition focus:border-primary" value={author} onChange={(e) => setAuthor(e.target.value)}>
            <option value="ALL">Все авторы</option>
            <option value="MAIN_COMPANY">Официальные</option>
            <option value="PARTNER">Партнёрские</option>
          </select>
          <select className="h-10 rounded-xl border border-line bg-surface px-3 text-[13px] text-ink outline-none transition focus:border-primary" value={courseType} onChange={(e) => setCourseType(e.target.value)}>
            <option value="ALL">Все типы</option>
            <option value="PUBLIC">Обычные</option>
            <option value="COMPANY">Курсы компании</option>
          </select>
          <select className="h-10 rounded-xl border border-line bg-surface px-3 text-[13px] text-ink outline-none transition focus:border-primary" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="ALL">Все уровни</option>
            <option value="BEGINNER">Начальный</option>
            <option value="INTERMEDIATE">Средний</option>
            <option value="ADVANCED">Продвинутый</option>
          </select>
          <button onClick={refetch} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-[13px] font-medium text-ink transition hover:border-primary hover:text-primary">
            <RefreshCw size={14} />
            <span className="hidden lg:inline">Обновить</span>
          </button>
        </div>

        {hasFilters && (
          <div className="flex items-center gap-2 border-t border-line px-5 py-2.5 text-[12px]">
            <Filter size={13} className="text-muted" />
            <span className="text-muted">Найдено: {filtered.length} из {courses.filter((c) => isCourseVisible(c, session)).length}</span>
            <button onClick={resetFilters} className="ml-auto font-medium text-primary hover:underline">Сбросить</button>
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-primary">
          Каталог временно недоступен. Обновите страницу через минуту.
        </div>
      )}

      {/* Grid */}
      <section className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((course, i) => {
          const enrolled = enrolledCourseIds.has(course.id);
          const enrolling = enrollingCourseIds.has(course.id);
          return (
            <motion.article
              key={course.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06, ease: "easeOut" }}
              className="card-hover group flex flex-col rounded-3xl border border-line bg-white shadow-card overflow-hidden"
            >
              {/* Cover / accent top */}
              <div className="relative h-36 overflow-hidden">
                {course.coverUrl ? (
                  <img src={course.coverUrl} alt={course.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-light via-red-50 to-surface">
                    <BookOpen size={36} className="text-primary/30" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                {/* Level badge top-right */}
                <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                  {levelLabel(course.level)}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap gap-1.5">
                  <span className="badge badge-red">{course.authorType === "MAIN_COMPANY" ? "Официальный" : "Партнёрский"}</span>
                  {course.courseType === "COMPANY" && <span className="badge badge-gray">Корпоративный</span>}
                </div>
                <h2 className="mt-3 text-[15px] font-semibold leading-[1.4] text-ink">{course.title}</h2>
                <p className="mt-1.5 line-clamp-2 flex-1 text-[13px] leading-5 text-muted">{course.description}</p>

                <div className="mt-4 flex items-center gap-4 text-[12px] text-muted">
                  <span className="flex items-center gap-1.5"><Clock size={12} />{course.durationHours} ч</span>
                  <span className="flex items-center gap-1.5"><Signal size={12} />{levelLabel(course.level)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-line p-4">
                <button
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-line px-3 text-[13px] font-medium text-ink transition hover:border-primary hover:text-primary"
                >
                  Подробнее
                </button>
                <button
                  onClick={() => enroll(course.id)}
                  disabled={enrolled || enrolling}
                  className={`inline-flex h-9 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold transition ${
                    enrolled
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-gradient text-white shadow-red-sm hover:opacity-90 disabled:cursor-not-allowed disabled:bg-none disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none"
                  }`}
                >
                  {enrolled ? (<><CheckCircle2 size={14} />Записан</>) : enrolling ? "Записываю..." : (<>Записаться<ArrowUpRight size={14} /></>)}
                </button>
              </div>
            </motion.article>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full rounded-3xl border border-line bg-white px-8 pb-10 pt-8 text-center shadow-card">
            <EmptyCoursesIllustration className="mx-auto h-auto w-56" />
            <p className="mt-2 text-[15px] font-semibold text-ink">Курсы не найдены</p>
            <p className="mt-1 text-[13px] text-muted">Попробуйте изменить фильтры или поисковый запрос</p>
            {hasFilters && (
              <button onClick={resetFilters} className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-primary-light px-4 text-[13px] font-medium text-primary">
                Сбросить фильтры
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Course Preview Page ──────────────────────────────────────────────────────

export function CoursePreviewPage({ courseId, courses, session }: { courseId: string; courses: Course[]; session: Session | null }) {
  const catalogCourse = courses.find((c) => c.id === courseId);
  const [details, setDetails] = useState<CourseDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState<string>("NOT_ENROLLED");
  const [enrolling, setEnrolling] = useState(false);

  const course = details?.course ?? catalogCourse;
  const lessons = details?.lessons ?? [];
  const modules = lessons.filter((l) => l.type === "FOLDER");
  const learningLessons = lessons.filter((l) => l.type !== "FOLDER");
  const isEnrolled = enrollmentStatus === "ACTIVE" || enrollmentStatus === "COMPLETED";

  useEffect(() => {
    setDetailsLoading(true);
    apiRequest<CourseDetails>(`/api/courses/${courseId}`)
      .then(setDetails)
      .catch(() => {})
      .finally(() => setDetailsLoading(false));
    if (session) {
      const org = session.user.organizationId ? `&organizationId=${session.user.organizationId}` : "";
      apiRequest<CourseProgress>(`/api/courses/${courseId}/progress?userId=${session.user.id}${org}`)
        .then((p) => setEnrollmentStatus(p.enrollmentStatus))
        .catch(() => {});
    }
  }, [courseId, session?.user.id]);

  async function enroll() {
    if (!session) { navigate("/login"); return; }
    if (!course || isEnrolled || enrolling) return;
    setEnrolling(true);
    try {
      await apiRequest(`/api/courses/${course.id}/enroll`, {
        method: "POST",
        body: JSON.stringify({ userId: session.user.id, organizationId: session.user.organizationId ?? null }),
      });
      navigate(`/courses/${courseId}/learn`);
    } catch (e) {
      toastError("Не удалось записаться", e instanceof Error ? e.message : undefined);
    } finally { setEnrolling(false); }
  }

  if (!course) return <PageHeader title="Курс не найден" text="Проверьте ссылку или откройте каталог курсов." />;
  if (!isCourseVisible(course, session)) return <PageHeader title="Нет доступа" text="Этот курс доступен только сотрудникам организации." />;

  const groups = [
    ...modules.map((m) => ({ id: m.id, title: m.title, lessons: learningLessons.filter((l) => l.parentId === m.id) })),
    ...(learningLessons.filter((l) => !l.parentId).length ? [{ id: "standalone", title: "Без модуля", lessons: learningLessons.filter((l) => !l.parentId) }] : []),
  ].filter((g) => g.lessons.length > 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="grid gap-5">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        <div className="relative">
          {course.coverUrl ? (
            <div className="relative h-56">
              <img src={course.coverUrl} alt={course.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <button onClick={() => navigate("/courses")} className="mb-4 inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-white/70 transition hover:text-white">
                  <ChevronLeft size={15} />Каталог курсов
                </button>
                <div className="flex flex-wrap gap-1.5">
                  <span className="badge badge-dark">{course.authorType === "MAIN_COMPANY" ? "Официальный курс" : "Партнёрский курс"}</span>
                  <span className="badge badge-dark">{levelLabel(course.level)}</span>
                </div>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{course.title}</h1>
                <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-white/70">{course.description}</p>
              </div>
            </div>
          ) : (
            <div className="bg-hero-gradient p-8">
              <button onClick={() => navigate("/courses")} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/60 transition hover:text-white">
                <ChevronLeft size={15} />Каталог курсов
              </button>
              <div className="flex flex-wrap gap-1.5">
                <span className="badge badge-dark">{course.authorType === "MAIN_COMPANY" ? "Официальный курс" : "Партнёрский курс"}</span>
                <span className="badge badge-dark">{levelLabel(course.level)}</span>
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{course.title}</h1>
              <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-white/60">{course.description}</p>
            </div>
          )}
        </div>
        {/* Quick stats */}
        <div className="grid grid-cols-2 divide-x divide-line border-t border-line md:grid-cols-4">
          {[
            { icon: <BookOpen size={16} />, label: "Уроков", value: String(learningLessons.length || "—") },
            { icon: <Layers size={16} />, label: "Модулей", value: String(modules.length || "—") },
            { icon: <Clock size={16} />, label: "Длительность", value: `${course.durationHours} ч` },
            { icon: <Signal size={16} />, label: "Уровень", value: levelLabel(course.level) },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-4">
              <span className="text-primary">{icon}</span>
              <div>
                <p className="text-[11px] text-muted">{label}</p>
                <p className="text-[14px] font-semibold text-ink">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Body */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Program */}
        <div className="grid gap-3">
          <h2 className="text-[17px] font-semibold text-ink">Программа курса</h2>
          {detailsLoading ? (
            <div className="grid gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-line bg-white shadow-card animate-pulse">
                  <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
                    <div className="h-4 w-4 rounded bg-line" />
                    <div className="h-3 w-32 rounded bg-line" />
                    <div className="ml-auto h-4 w-16 rounded-full bg-line" />
                  </div>
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                      <div className="h-7 w-7 rounded-full bg-line" />
                      <div className="h-3 flex-1 rounded bg-line" />
                      <div className="h-3 w-14 rounded bg-line" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : groups.length ? groups.map((group) => (
            <div
              key={group.id}
              className="overflow-hidden rounded-2xl border border-line bg-white shadow-card"
            >
              <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
                <Layers size={14} className="shrink-0 text-primary" />
                <p className="text-[13px] font-semibold text-ink">{group.title}</p>
                <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted border border-line">{group.lessons.length} {group.lessons.length === 1 ? "урок" : "уроков"}</span>
              </div>
              <div className="divide-y divide-line">
                {group.lessons.map((lesson, li) => (
                  <div key={lesson.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface text-[12px] font-semibold text-muted">{li + 1}</span>
                    <span className="flex-1 text-[13px] text-ink">{lesson.title}</span>
                    <span className="flex items-center gap-1 text-[11px] text-muted">
                      <Clock size={11} />{lesson.estimatedMinutes} мин
                    </span>
                    <Lock size={13} className="text-muted/40" />
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
              <BookOpen size={28} className="mx-auto text-muted/30" />
              <p className="mt-2 text-[13px] text-muted">Программа курса будет заполнена позже</p>
            </div>
          )}
        </div>

        {/* CTA sidebar */}
        <aside className="grid content-start gap-4 xl:sticky xl:top-[76px] xl:self-start">
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
            {course.coverUrl && (
              <img src={course.coverUrl} alt={course.title} className="h-32 w-full object-cover" />
            )}
            <div className="p-5">
              <p className="text-[22px] font-bold text-ink">Бесплатно</p>
              <p className="mt-1 text-[13px] text-muted">Полный доступ к материалам курса</p>
              {isEnrolled ? (
                <button onClick={() => navigate(`/courses/${courseId}/learn`)} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-gradient text-[14px] font-semibold text-white shadow-red-sm transition hover:opacity-90">
                  <PlayCircle size={16} />Продолжить обучение
                </button>
              ) : (
                <button onClick={enroll} disabled={enrolling} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-gradient text-[14px] font-semibold text-white shadow-red-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                  {enrolling ? "Записываю..." : <><GraduationCap size={16} />Записаться на курс</>}
                </button>
              )}
              <div className="mt-5 grid gap-2 text-[13px]">
                {[["Уроков", String(learningLessons.length || "—")], ["Модулей", String(modules.length || "—")], ["Длительность", `${course.durationHours} ч`], ["Уровень", levelLabel(course.level)], ["Статус", courseStatusLabel(course.status)]].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between border-b border-line pb-2 last:border-0 last:pb-0">
                    <span className="text-muted">{k}</span>
                    <span className="font-medium text-ink">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-primary" />
              <p className="text-[13px] font-semibold text-ink">После прохождения</p>
            </div>
            <ul className="mt-2 grid gap-1.5 text-[12px] text-muted">
              <li className="flex items-start gap-2"><CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" />Сертификат об окончании</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" />Запись в профиль</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-500" />Доступ к материалам навсегда</li>
            </ul>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}

// ─── Course Details Page ──────────────────────────────────────────────────────

export function CourseDetailsPage({ courseId, courses, session }: { courseId: string; courses: Course[]; session: Session | null }) {
  const catalogCourse = courses.find((item) => item.id === courseId);
  const [details, setDetails] = useState<CourseDetails | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const course = details?.course ?? catalogCourse;
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [completed, setCompleted] = useState<Record<string, number>>({});
  const [activeLessonId, setActiveLessonId] = useState<string>("");
  const [enrolling, setEnrolling] = useState(false);

  const lessons = details?.lessons ?? [];
  const modules = lessons.filter((l) => l.type === "FOLDER");
  const learningLessons = lessons.filter((l) => l.type !== "FOLDER");
  const activeLesson = learningLessons.find((l) => l.id === activeLessonId) ?? learningLessons[0];
  const activeLessonIndex = activeLesson ? learningLessons.findIndex((l) => l.id === activeLesson.id) : -1;
  const isEnrolled = progress?.enrollmentStatus === "ACTIVE" || progress?.enrollmentStatus === "COMPLETED";
  const isCompletedCourse = progress?.enrollmentStatus === "COMPLETED" || progress?.progress === 100;

  useEffect(() => {
    apiRequest<CourseDetails>(`/api/courses/${courseId}`)
      .then(setDetails)
      .catch(() => toastError("Не удалось загрузить программу курса", "Попробуйте обновить страницу."));
  }, [courseId]);

  useEffect(() => {
    if (!session) { setProgress(null); setCompleted({}); return; }
    loadProgress();
  }, [courseId, session?.user.id, session?.user.organizationId]);

  useEffect(() => {
    if (!learningLessons.length) return;
    if (!activeLessonId || !learningLessons.some((l) => l.id === activeLessonId)) setActiveLessonId(learningLessons[0].id);
  }, [activeLessonId, learningLessons]);

  async function loadProgress() {
    if (!session) return;
    const org = session.user.organizationId ? `&organizationId=${session.user.organizationId}` : "";
    try {
      const next = await apiRequest<CourseProgress>(`/api/courses/${courseId}/progress?userId=${session.user.id}${org}`);
      setProgress(next);
      setCompleted(Object.fromEntries(next.lessons.filter((l) => l.status === "COMPLETED").map((l) => [l.lessonId, l.score])));
    } catch {
      setProgress({ userId: session.user.id, courseId, progress: 0, enrollmentStatus: "NOT_ENROLLED", lessons: [] });
    }
  }

  async function enroll() {
    if (!session || !course) { navigate("/login"); return; }
    if (isEnrolled || enrolling) return;
    setEnrolling(true);
    try {
      const next = await apiRequest<EnrollmentProgress>(`/api/courses/${course.id}/enroll`, {
        method: "POST",
        body: JSON.stringify({ userId: session.user.id, organizationId: session.user.organizationId ?? null }),
      });
      setProgress({ userId: next.userId, courseId: course.id, progress: next.progress, enrollmentStatus: next.status, lessons: [] });
      await loadProgress();
      toastSuccess("Вы записаны на курс", "Теперь можно проходить уроки и видеть прогресс.");
    } catch (e) {
      toastError("Не удалось записаться", e instanceof Error ? e.message : undefined);
    } finally { setEnrolling(false); }
  }

  async function completeLesson(lesson: Lesson) {
    if (!session || !course) { navigate("/login"); return; }
    if (!isEnrolled) { toastError("Сначала запишитесь на курс"); return; }
    if (isCompletedCourse) { toastError("Курс уже завершён"); return; }
    try {
      const result = await apiRequest<LessonProgress>(`/api/courses/${course.id}/lessons/${lesson.id}/complete`, {
        method: "POST",
        body: JSON.stringify({ userId: session.user.id, organizationId: session.user.organizationId ?? null, answerJson: lesson.type === "TEST" ? buildAnswerJson(lesson, answers) : null }),
      });
      if (result.status === "COMPLETED") setCompleted({ ...completed, [lesson.id]: result.score });
      setProgress(progress ? { ...progress, progress: result.courseProgress, enrollmentStatus: result.courseProgress === 100 ? "COMPLETED" : progress.enrollmentStatus } : progress);
      await loadProgress();
      if (result.status === "COMPLETED") {
        toastSuccess("Урок засчитан", `Прогресс: ${result.courseProgress}%.`);
        const next = learningLessons[activeLessonIndex + 1];
        if (next) setActiveLessonId(next.id);
      } else {
        toastError("Тест нужно пройти ещё раз", `Результат: ${result.score}%, порог 70%.`);
      }
    } catch {
      toastError(completed[lesson.id] !== undefined ? "Урок уже засчитан" : "Не удалось сохранить прогресс");
    }
  }

  if (!course) return <PageHeader title="Курс не найден" text="Проверьте ссылку или откройте каталог курсов." />;
  if (!isCourseVisible(course, session)) return <PageHeader title="Нет доступа к курсу" text="Обычные пользователи проходят только обычные курсы. Курсы компании доступны только сотрудникам." />;

  function downloadCertificate(c: Course, s: Session) {
    const now = new Date();
    const dateStr = now.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    const certId = `CERT-${c.id.slice(0, 8).toUpperCase()}-${now.getFullYear()}`;
    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Сертификат — ${c.title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; font-family: 'Georgia', serif; }
  @page { size: A4 landscape; margin: 0; }
  .cert { width: 297mm; height: 210mm; position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; }
  .border-outer { position: absolute; inset: 10mm; border: 3px solid #b91c1c; border-radius: 8px; }
  .border-inner { position: absolute; inset: 13mm; border: 1px solid #fca5a5; border-radius: 6px; }
  .corner { position: absolute; width: 24px; height: 24px; border-color: #b91c1c; border-style: solid; }
  .tl { top: 8mm; left: 8mm; border-width: 3px 0 0 3px; }
  .tr { top: 8mm; right: 8mm; border-width: 3px 3px 0 0; }
  .bl { bottom: 8mm; left: 8mm; border-width: 0 0 3px 3px; }
  .br { bottom: 8mm; right: 8mm; border-width: 0 3px 3px 0; }
  .content { position: relative; z-index: 1; text-align: center; padding: 0 30mm; }
  .logo { font-size: 13pt; font-family: Arial, sans-serif; font-weight: 900; letter-spacing: 2px; color: #b91c1c; text-transform: uppercase; }
  .logo span { color: #1a1a2e; }
  .headline { margin-top: 6mm; font-size: 9pt; font-family: Arial, sans-serif; letter-spacing: 4px; text-transform: uppercase; color: #6b7280; }
  .name { margin-top: 8mm; font-size: 28pt; font-weight: bold; color: #1a1a2e; line-height: 1.2; }
  .award-text { margin-top: 5mm; font-size: 10pt; font-family: Arial, sans-serif; color: #4b5563; letter-spacing: 0.5px; }
  .course-title { margin-top: 4mm; font-size: 16pt; font-weight: bold; color: #b91c1c; line-height: 1.3; max-width: 180mm; }
  .divider { margin: 6mm auto; width: 60mm; height: 1px; background: linear-gradient(to right, transparent, #b91c1c, transparent); }
  .meta { display: flex; justify-content: center; gap: 20mm; margin-top: 6mm; }
  .meta-item { text-align: center; font-family: Arial, sans-serif; }
  .meta-label { font-size: 7pt; color: #9ca3af; letter-spacing: 2px; text-transform: uppercase; }
  .meta-value { font-size: 10pt; color: #1a1a2e; font-weight: bold; margin-top: 1mm; }
  .cert-id { position: absolute; bottom: 14mm; right: 18mm; font-family: 'Courier New', monospace; font-size: 7pt; color: #9ca3af; }
  .watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0.03; font-size: 120pt; font-weight: 900; color: #b91c1c; pointer-events: none; letter-spacing: -5px; }
</style>
</head>
<body>
<div class="cert">
  <div class="watermark">РЕД</div>
  <div class="border-outer"></div>
  <div class="border-inner"></div>
  <div class="corner tl"></div>
  <div class="corner tr"></div>
  <div class="corner bl"></div>
  <div class="corner br"></div>
  <div class="content">
    <div class="logo">РЕД<span>Академия</span></div>
    <div class="headline">Образовательная платформа</div>
    <div class="headline" style="margin-top:6mm">настоящим подтверждает, что</div>
    <div class="name">${s.user.fullName}</div>
    <div class="award-text">успешно завершил(а) курс</div>
    <div class="course-title">${c.title}</div>
    <div class="divider"></div>
    <div class="meta">
      <div class="meta-item">
        <div class="meta-label">Дата выдачи</div>
        <div class="meta-value">${dateStr}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Длительность</div>
        <div class="meta-value">${c.durationHours} часов</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Уровень</div>
        <div class="meta-value">${{ BEGINNER: "Начальный", INTERMEDIATE: "Средний", ADVANCED: "Продвинутый" }[c.level] ?? c.level}</div>
      </div>
    </div>
  </div>
  <div class="cert-id">${certId}</div>
</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificate-${c.id.slice(0, 8)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-5">
      {/* Hero header */}
      <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        <div className="bg-hero-gradient p-6">
          <button onClick={() => navigate(`/courses/${courseId}`)} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/60 transition hover:text-white">
            <ChevronLeft size={15} />
            О курсе
          </button>
          <div className="flex flex-wrap gap-1.5">
            <span className="badge badge-dark">{course.authorType === "MAIN_COMPANY" ? "Официальный курс" : "Партнёрский курс"}</span>
            <span className="badge badge-dark">{levelLabel(course.level)}</span>
            <span className="badge badge-dark">{course.durationHours} ч</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">{course.title}</h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-white/60">{course.description}</p>
        </div>
      </section>

      {/* Layout */}
      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar — on mobile shown collapsed at bottom; on xl shown as sticky side panel */}
        <aside className="order-2 flex flex-col gap-3 xl:order-1 xl:sticky xl:top-[76px] xl:self-start">
          {/* Progress */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-ink">Прогресс</span>
              <span className="text-xl font-bold text-primary">{progress?.progress ?? 0}%</span>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-red-gradient progress-bar" style={{ width: `${progress?.progress ?? 0}%` }} />
            </div>
            <p className="mt-2.5 text-[12px] leading-5 text-muted">
              {isCompletedCourse ? "🎉 Курс завершён!" : isEnrolled ? "Записаны. Проходите уроки по программе." : "Запишитесь, чтобы начать."}
            </p>
            {!isEnrolled && (
              <button onClick={enroll} disabled={enrolling} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-gradient text-[13px] font-semibold text-white shadow-red-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
                {enrolling ? "Записываю..." : "Записаться на курс"}
              </button>
            )}
          </div>

          {/* Certificate panel */}
          {isCompletedCourse && course.hasCertificate && session && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-card"
            >
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-600">
                  <Award size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-amber-900">Сертификат готов!</p>
                  <p className="text-[11px] text-amber-700">Скачайте и поделитесь</p>
                </div>
              </div>
              <button
                onClick={() => downloadCertificate(course, session)}
                className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 text-[13px] font-semibold text-white shadow-sm transition hover:bg-amber-600"
              >
                <Download size={14} />
                Скачать сертификат
              </button>
            </motion.div>
          )}

          {/* Info */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <h3 className="text-[13px] font-semibold text-ink">О курсе</h3>
            <dl className="mt-3 grid gap-2 text-[13px]">
              {[["Длительность", `${course.durationHours} ч`], ["Уровень", levelLabel(course.level)], ["Тип", course.courseType === "COMPANY" ? "Курс компании" : "Обычный"], ["Статус", courseStatusLabel(course.status)]].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Navigator */}
          <LessonNavigator modules={modules} lessons={learningLessons} activeLessonId={activeLesson?.id ?? ""} completed={completed} onSelect={setActiveLessonId} />
        </aside>

        {/* Lesson */}
        <main className="order-1 min-w-0 xl:order-2">
          {activeLesson ? (
            <LessonCard
              lesson={activeLesson}
              answers={answers}
              setAnswers={setAnswers}
              completedScore={completed[activeLesson.id]}
              disabled={!isEnrolled || isCompletedCourse || completed[activeLesson.id] !== undefined}
              onComplete={() => completeLesson(activeLesson)}
              previousLesson={learningLessons[activeLessonIndex - 1]}
              nextLesson={learningLessons[activeLessonIndex + 1]}
              onSelectLesson={setActiveLessonId}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center shadow-card">
              <BookOpen size={28} className="mx-auto text-muted/30" />
              <p className="mt-3 text-[14px] text-muted">Программа курса пока не заполнена</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type CourseDetails = { course: Course; lessons: Lesson[] };
type Lesson = {
  id: string; courseId: string; parentId?: string | null;
  type: "FOLDER" | "LONGREAD" | "TEST"; title: string;
  content?: string | null; htmlContent?: string | null;
  testSchema?: { questions?: Array<{ type: string; title: string; options?: string[] }> } | null;
  estimatedMinutes: number; position: number;
};
type LessonProgress = { lessonId: string; userId: string; courseId: string; status: string; score: number; courseProgress: number };
type CourseProgress = { userId: string; courseId: string; progress: number; enrollmentStatus: string; lessons: LessonProgress[] };
type EnrollmentProgress = { userId: string; courseId: string; progress: number; status: string };

// ─── Lesson Navigator ─────────────────────────────────────────────────────────

function isLessonUnlocked(lesson: Lesson, allLearningLessons: Lesson[], completed: Record<string, number>): boolean {
  const idx = allLearningLessons.findIndex((l) => l.id === lesson.id);
  if (idx <= 0) return true;
  return completed[allLearningLessons[idx - 1].id] !== undefined;
}

function LessonNavigator({ modules, lessons, activeLessonId, completed, onSelect }: { modules: Lesson[]; lessons: Lesson[]; activeLessonId: string; completed: Record<string, number>; onSelect: (id: string) => void }) {
  const withoutModule = lessons.filter((l) => !l.parentId);
  const groups = [
    ...modules.map((m) => ({ id: m.id, title: m.title, lessons: lessons.filter((l) => l.parentId === m.id) })),
    ...(withoutModule.length ? [{ id: "standalone", title: "Без модуля", lessons: withoutModule }] : []),
  ].filter((g) => g.lessons.length > 0);

  if (!groups.length) return null;

  return (
    <div className="grid gap-2">
      {groups.map((group) => (
        <div key={group.id} className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          <div className="border-b border-line bg-surface px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{group.title}</p>
          </div>
          <div className="grid gap-0.5 p-1.5">
            {group.lessons.map((lesson, index) => {
              const active = lesson.id === activeLessonId;
              const done = completed[lesson.id] !== undefined;
              const unlocked = isLessonUnlocked(lesson, lessons, completed);
              return (
                <button
                  key={lesson.id}
                  onClick={() => unlocked && onSelect(lesson.id)}
                  title={!unlocked ? "Завершите предыдущий урок, чтобы открыть этот" : undefined}
                  className={`flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] transition ${
                    active ? "bg-red-gradient text-white shadow-red-sm"
                    : !unlocked ? "cursor-not-allowed opacity-50"
                    : done ? "text-ink hover:bg-surface"
                    : "text-muted hover:bg-primary-light hover:text-primary"
                  }`}
                >
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${active ? "bg-white/20 text-white" : done ? "bg-emerald-100 text-emerald-700" : "bg-surface text-muted"}`}>
                    {!unlocked ? <Lock size={10} /> : done ? "✓" : index + 1}
                  </span>
                  <span className="min-w-0 truncate font-medium">{lesson.title}</span>
                  <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${active ? "bg-white/15 text-white" : done ? "bg-emerald-50 text-emerald-600" : "bg-surface text-muted"}`}>
                    {done ? "готово" : !unlocked ? "закрыт" : lesson.type === "TEST" ? "тест" : "урок"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Lesson Card ─────────────────────────────────────────────────────────────

function LessonCard({ lesson, answers, setAnswers, completedScore, disabled, onComplete, previousLesson, nextLesson, onSelectLesson }: {
  lesson: Lesson; answers: Record<string, string | string[]>; setAnswers: (a: Record<string, string | string[]>) => void;
  completedScore?: number; disabled?: boolean; onComplete: () => void; previousLesson?: Lesson; nextLesson?: Lesson; onSelectLesson?: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      <div className="border-b border-line bg-surface px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[12px] font-medium text-muted">{lesson.type === "TEST" ? "🧪 Тест" : "📖 Лонгрид"} · {lesson.estimatedMinutes} мин</p>
            <h3 className="mt-1 text-xl font-bold tracking-tight text-ink">{lesson.title}</h3>
          </div>
          {completedScore !== undefined && <span className="badge badge-green">✓ {completedScore}%</span>}
        </div>
      </div>

      <div className="min-h-[50vh] p-6">
        {lesson.type === "LONGREAD" && (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: markdownToHtml(lesson.htmlContent || lesson.content || "") }} />
        )}
        {lesson.type === "TEST" && (
          <div className="grid gap-4">
            {(lesson.testSchema?.questions ?? []).map((question, index) => (
              <div key={`${lesson.id}-${index}`} className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-[14px] font-semibold text-ink"><span className="mr-2 text-primary">#{index + 1}</span>{question.title}</p>
                <div className="mt-4 grid gap-2">
                  {question.options?.length ? question.options.map((option) => {
                    const key = answerKey(lesson.id, index);
                    const value = answers[key];
                    const checked = Array.isArray(value) ? value.includes(option) : value === option;
                    return (
                      <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-[14px] transition ${checked ? "border-primary bg-primary-light text-ink" : "border-line bg-white text-muted hover:border-primary/30 hover:bg-primary-light/30"}`}>
                        <input type={question.type === "multiple_choice" ? "checkbox" : "radio"} checked={checked} className="accent-primary"
                          onChange={() => setAnswers({ ...answers, [key]: question.type === "multiple_choice" ? toggleValue(value, option) : option })}
                        />
                        {option}
                      </label>
                    );
                  }) : (
                    <input className="h-11 rounded-xl border border-line bg-white px-3 text-[14px] outline-none transition focus:border-primary" value={(answers[answerKey(lesson.id, index)] as string) ?? ""} onChange={(e) => setAnswers({ ...answers, [answerKey(lesson.id, index)]: e.target.value })} placeholder="Ваш ответ..." />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface px-6 py-4">
        <button disabled={!previousLesson} onClick={() => previousLesson && onSelectLesson?.(previousLesson.id)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-[13px] font-medium text-ink transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40">
          <ChevronLeft size={15} />Предыдущий
        </button>
        <button onClick={onComplete} disabled={disabled} className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-gradient px-5 text-[13px] font-semibold text-white shadow-red-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-none disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none">
          <CheckCircle2 size={15} />{completedScore !== undefined ? "Засчитано" : lesson.type === "TEST" ? "Проверить тест" : "Отметить пройденным"}
        </button>
        <button disabled={!nextLesson} onClick={() => nextLesson && onSelectLesson?.(nextLesson.id)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-[13px] font-medium text-ink transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40">
          Следующий<ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function PageHeader({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-8 shadow-card">
      <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
      <p className="mt-2 max-w-2xl text-[14px] leading-6 text-muted">{text}</p>
    </section>
  );
}

function isCourseVisible(course: Course, session: Session | null) {
  if (course.courseType !== "COMPANY") return true;
  return Boolean(session?.user.organizationId && session.user.organizationId === course.organizationId);
}

function answerKey(lessonId: string, index: number) { return `${lessonId}:${index}`; }

function toggleValue(value: string | string[] | undefined, option: string) {
  const list = Array.isArray(value) ? value : [];
  return list.includes(option) ? list.filter((i) => i !== option) : [...list, option];
}

function buildAnswerJson(lesson: Lesson, answers: Record<string, string | string[]>) {
  return { answers: (lesson.testSchema?.questions ?? []).map((_, i) => ({ value: answers[answerKey(lesson.id, i)] ?? "" })) };
}

function markdownToHtml(source: string): string {
  if (!source.trim()) return "";
  // Already HTML (editor-produced content starts with a tag)
  if (/^\s*<[a-z]/i.test(source)) return source;

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const inline = (text: string): string => {
    let s = esc(text);
    // inline code first (protect content from bold/italic processing)
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    // bold
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/__(.+?)__/g, "<strong>$1</strong>");
    // italic
    s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    s = s.replace(/_([^_]+)_/g, "<em>$1</em>");
    return s;
  };

  const lines = source.split("\n");
  const out: string[] = [];
  let inCode = false;
  let codeLang = "";
  let codeLines: string[] = [];
  let inList = false;
  let ordered = false;

  const closeList = () => {
    if (inList) { out.push(ordered ? "</ol>" : "</ul>"); inList = false; }
  };

  for (const line of lines) {
    // Fenced code block delimiter
    if (/^```/.test(line.trimStart())) {
      if (inCode) {
        const lang = codeLang ? ` class="language-${esc(codeLang)}"` : "";
        out.push(`<pre><code${lang}>${esc(codeLines.join("\n"))}</code></pre>`);
        codeLines = []; codeLang = ""; inCode = false;
      } else {
        closeList();
        codeLang = line.trimStart().slice(3).trim();
        inCode = true;
      }
      continue;
    }

    if (inCode) { codeLines.push(line); continue; }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inList || ordered) { if (inList) out.push("</ol>"); out.push("<ul>"); inList = true; ordered = false; }
      out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`);
      continue;
    }
    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      if (!inList || !ordered) { if (inList) out.push("</ul>"); out.push("<ol>"); inList = true; ordered = true; }
      out.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ""))}</li>`);
      continue;
    }
    closeList();

    if (line.startsWith("### ")) out.push(`<h3>${inline(line.slice(4))}</h3>`);
    else if (line.startsWith("## ")) out.push(`<h2>${inline(line.slice(3))}</h2>`);
    else if (line.startsWith("# ")) out.push(`<h1>${inline(line.slice(2))}</h1>`);
    else if (line.trim() === "") { /* blank line — paragraph break */ }
    else out.push(`<p>${inline(line)}</p>`);
  }

  // Unclosed code block
  if (inCode) out.push(`<pre><code>${esc(codeLines.join("\n"))}</code></pre>`);
  closeList();
  return out.join("\n");
}
