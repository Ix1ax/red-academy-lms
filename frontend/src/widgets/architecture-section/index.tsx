import { Activity } from "lucide-react";

export function ArchitectureSection() {
  const services = ["Аккаунты и роли", "Организации", "Курсы и интенсивы", "Уведомления и материалы"];

  return (
    <section id="architecture" className="mx-auto max-w-7xl px-6 py-8 pb-16">
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Activity className="text-primary" />
          <div>
            <h2 className="text-2xl font-semibold text-ink">Надежная платформа обучения</h2>
            <p className="text-sm text-muted">Все основные сценарии разделены по понятным рабочим зонам</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {services.map((service) => (
            <div key={service} className="rounded-lg border border-border bg-slate-50 p-4 text-sm font-semibold text-ink">
              {service}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
