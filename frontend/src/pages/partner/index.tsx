import type { Course } from "@/entities/course/model/types";
import type { Intensive } from "@/entities/intensive/model/types";
import type { Session } from "@/shared/auth/session";
import { courseStatusLabel, intensiveStatusLabel } from "@/shared/lib/labels";
import { navigate } from "@/shared/router";
import { BookOpen, ClipboardCheck, Layers3, Plus, Trophy, UsersRound } from "lucide-react";
import type { ReactNode } from "react";

export function PartnerPage({
  courses,
  intensives,
  session
}: {
  courses: Course[];
  intensives: Intensive[];
  setCourses: (items: Course[]) => void;
  setIntensives: (items: Intensive[]) => void;
  session: Session | null;
}) {
  const partnerCourses = courses.filter((course) => course.authorType === "PARTNER" && course.organizationId === session?.user.organizationId);
  const partnerIntensives = intensives.filter((intensive) => intensive.organizerType === "PARTNER" && intensive.organizationId === session?.user.organizationId);

  return (
    <div className="grid gap-5">
      <Header title="Кабинет партнера" text="Партнерский кабинет разделен на понятные рабочие зоны: создание контента, материалы, интенсивы и проверка участников." />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-3xl border border-line bg-white p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-primary">
              <Layers3 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">Студия образовательного продукта</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Партнер создает и редактирует контент в разделе “Мои курсы”, без доступа к кабинету корпоративного клиента.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <ActionCard icon={<BookOpen size={20} />} title="Мои курсы" text="Создание, редактирование, публикация и скрытие партнерских курсов." onClick={() => navigate("/my-courses")} />
            <ActionCard icon={<Trophy size={20} />} title="Мои интенсивы" text="Дата старта, этапы, задания и менеджеры из сотрудников организации." onClick={() => navigate("/my-courses")} />
          </div>
        </div>

        <aside className="rounded-3xl border border-line bg-white p-5 shadow-panel">
          <ClipboardCheck className="text-primary" />
          <h2 className="mt-4 text-lg font-semibold text-ink">Рабочий процесс</h2>
          <div className="mt-4 grid gap-3 text-sm text-muted">
            <p className="rounded-2xl bg-surface p-3">Создавайте курсы и интенсивы в разделе “Мои курсы”.</p>
            <p className="rounded-2xl bg-surface p-3">Публикуйте материалы после подготовки программы.</p>
            <p className="rounded-2xl bg-surface p-3">Участники и результаты доступны на страницах программ.</p>
          </div>
        </aside>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-3xl border border-line bg-white p-5 shadow-panel">
          <h2 className="text-lg font-semibold text-ink">Мои материалы</h2>
          <div className="mt-4 grid gap-3">
            {partnerCourses.map((course) => (
              <button key={course.id} onClick={() => navigate(`/courses/${course.id}`)} className="rounded-2xl border border-line p-4 text-left hover:border-red-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-ink">{course.title}</h3>
                  <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-muted">{course.courseType === "COMPANY" ? "Курс компании" : "Обычный"} · {courseStatusLabel(course.status)}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{course.description}</p>
              </button>
            ))}
            {partnerCourses.length === 0 && <p className="rounded-2xl bg-surface p-4 text-sm leading-6 text-muted">Созданные курсы партнера появятся здесь.</p>}
          </div>
        </div>
        <aside className="rounded-3xl border border-line bg-white p-5 shadow-panel">
          <h2 className="text-lg font-semibold text-ink">Интенсивы партнера</h2>
          <div className="mt-4 grid gap-3">
            {partnerIntensives.slice(0, 5).map((intensive) => (
              <button key={intensive.id} onClick={() => navigate(`/intensives/${intensive.id}`)} className="rounded-2xl border border-line p-3 text-left hover:border-red-200">
                <p className="text-sm font-semibold text-ink">{intensive.title}</p>
                <p className="mt-1 text-xs text-muted">{intensiveStatusLabel(intensive.status)} · лимит {intensive.participantLimit}</p>
              </button>
            ))}
            {partnerIntensives.length === 0 && <p className="rounded-2xl bg-surface p-3 text-sm text-muted">Созданные интенсивы появятся здесь.</p>}
          </div>
        </aside>
      </section>
    </div>
  );
}

function ActionCard({ icon, title, text, onClick }: { icon: ReactNode; title: string; text: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-line bg-white p-4 text-left transition hover:border-red-200 hover:bg-red-50/40">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-primary">{icon}</div>
      <h3 className="mt-4 font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
    </button>
  );
}

function Header({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-6 shadow-panel">
      <div className="flex items-center gap-3">
        <UsersRound className="text-primary" size={24} />
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{text}</p>
    </section>
  );
}
