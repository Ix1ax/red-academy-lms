import type { Course } from "@/entities/course/model/types";
import type { Intensive } from "@/entities/intensive/model/types";
import { apiRequest } from "@/shared/api/client";
import type { Session } from "@/shared/auth/session";
import { intensiveStatusLabel } from "@/shared/lib/labels";
import { navigate } from "@/shared/router";
import { ArrowUpRight, BookOpen, GraduationCap, Trophy } from "lucide-react";
import { EmptyDashboardIllustration } from "@/shared/ui/illustrations";
import { useEffect, useState } from "react";

type Certificate = { id: string; title: string; issuedAt: string };
type EnrolledCourse = { course: Course; progress: number; status: "ACTIVE" | "COMPLETED" };

export function DashboardPage({ courses, intensives, session }: { courses: Course[]; intensives: Intensive[]; session: Session | null }) {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }

    async function load() {
      setLoading(true);
      const org = session!.user.organizationId ? `&organizationId=${session!.user.organizationId}` : "";
      const visibleCourses = courses.filter(
        (c) => c.courseType !== "COMPANY" || session!.user.organizationId === c.organizationId,
      );

      const results = await Promise.allSettled(
        visibleCourses.map((course) =>
          apiRequest<{ userId: string; courseId: string; progress: number; enrollmentStatus: string }>(
            `/api/courses/${course.id}/progress?userId=${session!.user.id}${org}`,
          ).then((p) => ({ course, progress: p.progress, status: p.enrollmentStatus })),
        ),
      );

      const enrolled: EnrolledCourse[] = results
        .filter(
          (r): r is PromiseFulfilledResult<{ course: Course; progress: number; status: string }> =>
            r.status === "fulfilled" && (r.value.status === "ACTIVE" || r.value.status === "COMPLETED"),
        )
        .map((r) => ({ course: r.value.course, progress: r.value.progress, status: r.value.status as "ACTIVE" | "COMPLETED" }));

      setEnrolledCourses(enrolled);

      try {
        setCertificates(await apiRequest<Certificate[]>(`/api/certificates?userId=${session!.user.id}`));
      } catch {
        setCertificates([]);
      }
      setLoading(false);
    }

    load();
  }, [session?.user.id, courses]);

  const activeIntensives = intensives.filter((i) => i.status === "ENROLLMENT_OPEN" || i.status === "REGISTRATION_OPEN" || i.status === "IN_PROGRESS");

  return (
    <div className="grid gap-5">
      {/* Header */}
      <section className="rounded-3xl border border-line bg-white p-6 shadow-panel">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Личный кабинет</h1>
        <p className="mt-2 max-w-3xl text-[14px] leading-6 text-muted">
          Ваши записи на курсы, доступные интенсивы и выданные сертификаты.
        </p>
        {!loading && (
          <div className="mt-4 flex flex-wrap gap-4">
            <Stat value={enrolledCourses.length} label="Курсов записано" />
            <Stat value={enrolledCourses.filter((c) => c.status === "COMPLETED").length} label="Завершено" />
            <Stat value={certificates.length} label="Сертификатов" />
          </div>
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Enrolled courses */}
        <div className="grid content-start gap-4">
          <h2 className="text-[15px] font-semibold text-ink">Мои курсы</h2>

          {loading && (
            <div className="rounded-2xl border border-line bg-white p-6 text-center text-[13px] text-muted shadow-panel">
              Загружаем прогресс...
            </div>
          )}

          {!loading && enrolledCourses.length === 0 && (
            <article className="rounded-3xl border border-dashed border-line bg-white px-8 pb-8 pt-6 text-center shadow-panel">
              <EmptyDashboardIllustration className="mx-auto h-auto w-52" />
              <p className="mt-2 text-[14px] font-semibold text-ink">Вы пока не записаны ни на один курс</p>
              <p className="mt-1 text-[13px] text-muted">Откройте каталог и запишитесь на интересный курс</p>
              <button
                onClick={() => navigate("/courses")}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-red-gradient px-5 text-[13px] font-semibold text-white shadow-red-sm transition hover:opacity-90"
              >
                <BookOpen size={14} />
                Перейти в каталог
              </button>
            </article>
          )}

          {enrolledCourses.map(({ course, progress, status }) => (
            <article key={course.id} className="overflow-hidden rounded-3xl border border-line bg-white shadow-panel">
              {/* Cover strip */}
              {course.coverUrl && (
                <div className="relative h-24 overflow-hidden">
                  <img src={course.coverUrl} alt={course.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
              )}
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700"
                            : progress > 0
                              ? "bg-amber-50 text-amber-700"
                              : "bg-surface text-muted"
                        }`}
                      >
                        {status === "COMPLETED" ? "✓ Завершён" : progress > 0 ? "В процессе" : "Не начат"}
                      </span>
                      <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                        {course.courseType === "COMPANY" ? "Курс компании" : "Публичный"}
                      </span>
                    </div>
                    <h2 className="mt-2 text-[16px] font-semibold text-ink">{course.title}</h2>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-muted">{course.description}</p>
                  </div>
                  <button
                    onClick={() => navigate(status === "COMPLETED" ? `/courses/${course.id}` : `/courses/${course.id}/learn`)}
                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-red-gradient px-4 text-[13px] font-semibold text-white shadow-red-sm transition hover:opacity-90"
                  >
                    <ArrowUpRight size={15} />
                    {status === "COMPLETED" ? "Смотреть" : "Продолжить"}
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="text-muted">Прогресс</span>
                    <span className="font-semibold text-ink">{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface">
                    <div
                      className={`h-full rounded-full transition-all ${status === "COMPLETED" ? "bg-emerald-500" : "bg-red-gradient"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Sidebar */}
        <aside className="grid content-start gap-4">
          <Panel title="Активные интенсивы" icon={<Trophy size={19} />}>
            {activeIntensives.length === 0 && (
              <p className="rounded-2xl bg-surface p-3 text-[13px] text-muted">Активных интенсивов нет</p>
            )}
            {activeIntensives.slice(0, 4).map((intensive) => (
              <button
                key={intensive.id}
                onClick={() => navigate(`/intensives/${intensive.id}`)}
                className="rounded-2xl border border-line p-3 text-left transition hover:border-red-200 hover:bg-red-50/30"
              >
                <p className="text-[13px] font-semibold text-ink">{intensive.title}</p>
                <p className="mt-1 text-[11px] text-muted">{intensiveStatusLabel(intensive.status)}</p>
              </button>
            ))}
          </Panel>

          <Panel title="Сертификаты" icon={<GraduationCap size={19} />}>
            {certificates.length === 0 && (
              <p className="rounded-2xl bg-surface p-3 text-[13px] text-muted">
                Завершите курс, чтобы получить сертификат.
              </p>
            )}
            {certificates.map((certificate) => (
              <div key={certificate.id} className="rounded-2xl border border-line p-3">
                <p className="text-[13px] font-semibold text-ink">{certificate.title}</p>
                <p className="mt-1 text-[11px] text-muted">
                  {new Date(certificate.issuedAt).toLocaleDateString("ru-RU")}
                </p>
              </div>
            ))}
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-2.5 text-center">
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-5 shadow-panel">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-primary">{icon}</div>
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}
