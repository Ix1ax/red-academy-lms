import type { Course } from "@/entities/course/model/types";
import type { Intensive } from "@/entities/intensive/model/types";
import type { Session } from "@/shared/auth/session";
import { intensiveStatusLabel } from "@/shared/lib/labels";
import { navigate } from "@/shared/router";
import {
  BookOpenCheck,
  Building2,
  CheckCircle2,
  FolderKanban,
  Plus,
  Trophy,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";

/**
 * Кабинет главной компании (роль ADMIN).
 *
 * Это обзорный лендинг: метрики платформы и быстрые переходы в студию
 * контента и в администрирование. Управление сотрудниками живёт в
 * соответствующих кабинетах: у партнёров — на странице «Партнёр», у
 * главной компании — в разделе «Администрирование» → «Организации».
 */
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
  const companyCourses = useMemo(() => courses, [courses]);
  const companyIntensives = useMemo(() => intensives, [intensives]);

  return (
    <div className="grid gap-5">
      {/* Header */}
      <section className="rounded-3xl border border-line bg-white p-5 shadow-panel sm:p-6">
        <div className="flex items-center gap-3">
          <Building2 className="shrink-0 text-primary" size={24} />
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Кабинет главной компании</h1>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Главная компания управляет официальными курсами, интенсивами, партнёрами и общей аналитикой платформы.
        </p>
      </section>

      {/* Metrics */}
      <section className="grid gap-3 md:grid-cols-3">
        <Metric icon={<UsersRound size={20} />} label="Организаций" value="Все" />
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

          {/* Administration */}
          <div className="rounded-3xl border border-line bg-white p-5 shadow-panel">
            <FolderKanban className="text-primary" size={20} />
            <h2 className="mt-3 text-lg font-semibold text-ink">Администрирование</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Партнёрские заявки, пользователи, организации и сотрудники компаний — в административной панели.
            </p>
            <button
              onClick={() => navigate("/admin")}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-medium text-white"
            >
              Открыть администрирование
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="grid content-start gap-4">
          <div className="rounded-3xl border border-line bg-white p-5 shadow-panel">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-primary">
                <Trophy size={17} />
              </div>
              <h2 className="text-[15px] font-semibold text-ink">Интенсивы</h2>
            </div>
            {companyIntensives.length === 0 ? (
              <p className="rounded-2xl bg-surface p-3 text-[13px] text-muted">Интенсивы появятся после создания.</p>
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
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-primary shadow-sm">{icon}</div>
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
