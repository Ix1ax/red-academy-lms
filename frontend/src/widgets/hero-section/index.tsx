import { motion } from "framer-motion";
import { BookOpen, Building2, CheckCircle2, ChevronRight, ShieldCheck, Sparkles, UsersRound } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-[radial-gradient(circle_at_20%_0%,rgba(20,184,166,.16),transparent_32%),linear-gradient(135deg,#ffffff_0%,#f3f7f6_52%,#fff7ed_100%)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/70 px-3 py-1 text-sm font-medium text-primary">
            <ShieldCheck size={16} />
            Дипломная LMS для организаций и пользователей
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-normal text-ink md:text-6xl">
            Корпоративное обучение, партнерские курсы и интенсивы в одной платформе
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            Основная компания управляет экосистемой, партнеры публикуют программы, компании обучают сотрудников, а пользователи проходят курсы и недельные интенсивы с заданиями, рейтингом и сертификатами.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft">
              Открыть каталог <ChevronRight size={17} />
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold text-ink">
              Смотреть интенсивы
            </button>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, delay: 0.1 }} className="rounded-xl border border-border bg-white p-4 shadow-soft">
          <div className="grid gap-3">
            {[
              ["Основная компания", <Building2 size={18} />],
              ["Партнер", <Sparkles size={18} />],
              ["Корпоративный клиент", <UsersRound size={18} />],
              ["Пользователь", <BookOpen size={18} />]
            ].map(([item, icon]) => (
              <div key={String(item)} className="flex items-center justify-between rounded-lg border border-border bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-md bg-white text-primary">{icon}</div>
                  <span className="font-medium">{item}</span>
                </div>
                <CheckCircle2 className="text-primary" size={18} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
