import { GraduationCap, Radio } from "lucide-react";

export function TopBar({ isLive }: { isLive: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/86 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white">
            <GraduationCap size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">РедАкадемия</p>
            <p className="text-xs text-muted">Платформа РедСофт</p>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
          <a href="#courses">Курсы</a>
          <a href="#intensives">Интенсивы</a>
          <a href="#workspace">Кабинеты</a>
          <a href="#organizations">Для компаний</a>
        </nav>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${isLive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-primary"}`}>
          <Radio size={14} />
          {isLive ? "Платформа онлайн" : "Временное обслуживание"}
        </span>
      </div>
    </header>
  );
}
