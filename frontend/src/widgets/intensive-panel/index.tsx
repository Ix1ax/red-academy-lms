import type { Intensive } from "@/entities/intensive/model/types";
import { Trophy } from "lucide-react";

export function IntensivePanel({ intensives }: { intensives: Intensive[] }) {
  return (
    <section id="intensives" className="rounded-xl border border-border bg-ink p-5 text-white shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Интенсивы</h2>
          <p className="text-sm text-white/62">Недельные потоки, задания и рейтинг</p>
        </div>
        <Trophy className="text-accent" />
      </div>
      <div className="grid gap-4">
        {intensives.map((intensive) => (
          <article key={intensive.id} className="rounded-lg border border-white/12 bg-white/8 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-ink">{intensive.status}</span>
              <span className="text-xs text-white/70">{intensive.participantLimit} мест</span>
            </div>
            <h3 className="font-semibold">{intensive.title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/70">{intensive.description}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              {["Вводный", "Практика", "Финал"].map((stage) => (
                <span key={stage} className="rounded-md bg-white/10 px-2 py-2">{stage}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
