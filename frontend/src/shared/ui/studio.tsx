export function StudioModeButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition ${
        active ? "bg-white text-primary shadow-sm" : "text-muted hover:bg-white hover:text-ink"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export function StudioField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium text-ink">
      {label}
      <input className="h-11 min-w-0 rounded-xl border border-line px-3 outline-none focus:border-primary" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function StudioTextArea({
  label,
  value,
  onChange,
  mono = false,
  minHeight = "min-h-24"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  mono?: boolean;
  minHeight?: string;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium text-ink">
      {label}
      <textarea
        className={`${minHeight} min-w-0 rounded-xl border border-line px-3 py-2 outline-none focus:border-primary ${mono ? "font-mono text-sm" : ""}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function StudioStep({ number, title, text, children }: { number: string; title: string; text: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface p-3 sm:p-4">
      <div className="grid min-w-0 gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-sm font-semibold text-primary shadow-sm">{number}</div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
          <div className="mt-3 min-w-0">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function StudioPreview({
  badge,
  eyebrow,
  title,
  text,
  notes = ["Можно редактировать позже", "Готово к публикации"]
}: {
  badge?: string;
  eyebrow?: string;
  title: string;
  text: string;
  notes?: string[];
}) {
  return (
    <aside className="rounded-2xl border border-line bg-surface p-4">
      {badge && <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-primary">{badge}</span>}
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{eyebrow}</p>}
      <h3 className="mt-4 text-xl font-semibold leading-tight text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted">{text}</p>
      {notes.length > 0 && (
        <div className="mt-5 grid gap-2 text-xs text-muted">
          {notes.map((note) => (
            <span key={note} className="rounded-xl bg-white px-3 py-2">{note}</span>
          ))}
        </div>
      )}
    </aside>
  );
}
