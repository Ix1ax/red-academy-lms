import { Bell, Building2, LayoutDashboard, UsersRound } from "lucide-react";

export function WorkspaceSection() {
  const cards = [
    ["Админ-панель", "Партнеры, модерация, пользователи, аудит", LayoutDashboard],
    ["Кабинет партнера", "Курсы, интенсивы, наставники, аналитика", Building2],
    ["Кабинет компании", "Сотрудники, группы, назначения", UsersRound],
    ["Личный кабинет", "Прогресс, задания, сертификаты, уведомления", Bell]
  ] as const;

  return (
    <section id="workspace" className="mx-auto max-w-7xl px-6 py-8">
      <h2 className="text-2xl font-semibold text-ink">Рабочие кабинеты</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map(([title, text, Icon]) => (
          <div key={title} className="rounded-lg border border-border bg-white p-5 shadow-sm">
            <Icon className="text-primary" />
            <h3 className="mt-4 font-semibold text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
