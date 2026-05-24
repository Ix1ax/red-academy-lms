import type { Course } from "@/entities/course/model/types";
import { BookOpen, ChevronRight } from "lucide-react";

export function CourseCatalog({ courses }: { courses: Course[] }) {
  return (
    <section id="courses" className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">Каталог курсов</h2>
          <p className="text-sm text-muted">Официальные программы и партнерский контент</p>
        </div>
        <BookOpen className="text-primary" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((course) => (
          <article key={course.id} className="rounded-lg border border-border bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary">
                {course.authorType === "MAIN_COMPANY" ? "Официальный курс" : "Партнерский курс"}
              </span>
              <span className="text-xs text-muted">{course.durationHours} ч</span>
            </div>
            <h3 className="font-semibold text-ink">{course.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{course.description}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="font-medium text-ink">{course.level}</span>
              <button className="inline-flex items-center gap-1 font-semibold text-primary">
                Открыть <ChevronRight size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
