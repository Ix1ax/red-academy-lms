export function StatsSection() {
  const items = [
    ["4", "микросервиса"],
    ["3", "этапа интенсива"],
    ["20-30", "участников в потоке"],
    ["S3", "файлы и сертификаты"]
  ];

  return (
    <section className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 py-8 lg:grid-cols-4">
      {items.map(([value, label]) => (
        <div key={label} className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-3xl font-semibold text-ink">{value}</p>
          <p className="mt-1 text-sm text-muted">{label}</p>
        </div>
      ))}
    </section>
  );
}
