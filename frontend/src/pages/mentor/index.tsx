import type { Intensive } from "@/entities/intensive/model/types";
import { apiRequest } from "@/shared/api/client";
import type { Session } from "@/shared/auth/session";
import { participantStatusLabel, submissionStatusLabel } from "@/shared/lib/labels";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { CheckCircle2, ClipboardCheck, Github, MessageSquareText, UserCog, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Participant = {
  id: string;
  userId: string;
  githubUrl?: string | null;
  score: number;
  status: string;
  email?: string | null;
  fullName?: string | null;
};

type Submission = {
  id: string;
  taskId: string;
  userId: string;
  githubUrl?: string | null;
  answerText?: string | null;
  status: string;
  score?: number | null;
  stageTitle?: string | null;
  email?: string | null;
  fullName?: string | null;
  reviewerComment?: string | null;
};

type IntensiveDetails = {
  intensive: Intensive;
  rating: Participant[];
  submissions: Submission[];
};

export function MentorPage({ session, intensives }: { session: Session | null; intensives: Intensive[] }) {
  const [selectedIntensiveId, setSelectedIntensiveId] = useState("");
  const [details, setDetails] = useState<IntensiveDetails | null>(null);
  const [reason, setReason] = useState("Не выполнено задание этапа");
  const [reviews, setReviews] = useState<Record<string, { score: string; comment: string }>>({});
  const [pendingParticipantId, setPendingParticipantId] = useState("");
  const [pendingReviewId, setPendingReviewId] = useState("");

  const availableIntensives = useMemo(() => intensives.filter((item) => item.status !== "DRAFT"), [intensives]);

  useEffect(() => {
    if (!selectedIntensiveId && availableIntensives[0]) {
      setSelectedIntensiveId(availableIntensives[0].id);
    }
  }, [availableIntensives, selectedIntensiveId]);

  useEffect(() => {
    if (!selectedIntensiveId) return;
    loadDetails(selectedIntensiveId).catch(() => toastError("Не удалось загрузить участников интенсива"));
  }, [selectedIntensiveId]);

  async function loadDetails(intensiveId: string) {
    setDetails(await apiRequest<IntensiveDetails>(`/api/intensives/${intensiveId}`));
  }

  async function kickParticipant(participant: Participant) {
    if (pendingParticipantId) return;
    if (!session || !selectedIntensiveId) return;
    setPendingParticipantId(participant.id);
    try {
      await apiRequest(`/api/intensives/${selectedIntensiveId}/participants/${participant.id}/kick`, {
        method: "POST",
        body: JSON.stringify({ managerUserId: session.user.id, reason })
      });
      await loadDetails(selectedIntensiveId);
      toastSuccess("Участник исключен", "Повторная заявка на этот интенсив закрыта.");
    } catch (error) {
      toastError("Не удалось исключить участника", error instanceof Error ? error.message : undefined);
    } finally {
      setPendingParticipantId("");
    }
  }

  async function reviewSubmission(submission: Submission) {
    if (pendingReviewId) return;
    const draft = reviews[submission.id] ?? { score: String(submission.score ?? 100), comment: submission.reviewerComment ?? "" };
    setPendingReviewId(submission.id);
    try {
      await apiRequest(`/api/tasks/submissions/${submission.id}/review`, {
        method: "POST",
        body: JSON.stringify({ score: Number(draft.score) || 0, comment: draft.comment })
      });
      await loadDetails(selectedIntensiveId);
      toastSuccess("Решение проверено", "Баллы обновлены в рейтинге.");
    } catch (error) {
      toastError("Не удалось сохранить оценку", error instanceof Error ? error.message : undefined);
    } finally {
      setPendingReviewId("");
    }
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-3xl border border-line bg-white p-6 shadow-panel">
        <div className="flex items-center gap-3">
          <UserCog className="text-primary" size={24} />
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Кабинет наставника</h1>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Выберите интенсив, смотрите зачисленных участников и исключайте тех, кто не справился с этапом.</p>
      </section>
      <section className="rounded-3xl border border-line bg-white p-5 shadow-panel">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(260px,420px)]">
          <label className="grid gap-1.5 text-sm font-medium text-ink">
            Интенсив
            <select className="h-11 rounded-xl border border-line px-3 outline-none focus:border-primary" value={selectedIntensiveId} onChange={(event) => setSelectedIntensiveId(event.target.value)}>
              {availableIntensives.map((intensive) => (
                <option key={intensive.id} value={intensive.id}>{intensive.title}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-ink">
            Причина исключения
            <input className="h-11 rounded-xl border border-line px-3 outline-none focus:border-primary" value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-panel">
        <div className="border-b border-line p-5">
          <h2 className="text-lg font-semibold text-ink">Участники интенсива</h2>
          <p className="mt-1 text-sm text-muted">Список участников выбранного интенсива.</p>
        </div>
        {(details?.rating ?? []).map((participant, index) => {
          const eliminated = participant.status === "ELIMINATED";
          return (
            <div key={participant.id} className={`grid gap-4 p-5 md:grid-cols-[1fr_220px_120px_150px] md:items-center ${index !== (details?.rating.length ?? 0) - 1 ? "border-b border-line" : ""}`}>
              <div>
                <p className="font-semibold text-ink">{participant.fullName || `Участник #${index + 1}`}</p>
                <p className="mt-1 text-sm text-muted">{participant.email || "Email не указан"}</p>
                {participant.githubUrl ? (
                  <a className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-primary" href={participant.githubUrl} target="_blank" rel="noreferrer"><Github size={15} /> {githubUsername(participant.githubUrl)}</a>
                ) : (
                  <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted"><Github size={15} /> GitHub не указан</p>
                )}
              </div>
              <span className="text-sm text-muted">Баллы: {participant.score}</span>
              <span className={`rounded-full px-2.5 py-1 text-center text-xs font-medium ${eliminated ? "bg-red-50 text-primary" : "bg-emerald-50 text-emerald-700"}`}>{participantStatusLabel(participant.status)}</span>
              <button onClick={() => kickParticipant(participant)} disabled={eliminated || Boolean(pendingParticipantId)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-muted">
                <XCircle size={15} />
                {pendingParticipantId === participant.id ? "Исключаю..." : "Исключить"}
              </button>
            </div>
          );
        })}
        {(details?.rating ?? []).length === 0 && (
          <p className="p-5 text-sm leading-6 text-muted">Пока нет зачисленных участников. После одобрения заявок они появятся здесь.</p>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-panel">
        <div className="border-b border-line p-5">
          <h2 className="text-lg font-semibold text-ink">Проверка решений</h2>
          <p className="mt-1 text-sm text-muted">Решения участников по этапам выбранного интенсива.</p>
        </div>
        <div className="grid gap-3 p-5">
          {(details?.submissions ?? []).map((submission) => {
            const draft = reviews[submission.id] ?? { score: String(submission.score ?? 100), comment: submission.reviewerComment ?? "" };
            return (
              <div key={submission.id} className="grid min-w-0 gap-3 rounded-2xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{submission.stageTitle || "Этап интенсива"}</p>
                    <p className="mt-1 text-sm text-muted">{submission.fullName || submission.email || "Участник"}</p>
                    {submission.githubUrl && <a className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-primary" href={submission.githubUrl} target="_blank" rel="noreferrer"><Github size={15} /> {githubUsername(submission.githubUrl)}</a>}
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-muted">{submissionStatusLabel(submission.status)}</span>
                </div>
                {submission.answerText && <p className="rounded-xl bg-white p-3 text-sm leading-6 text-muted">{submission.answerText}</p>}
                <div className="grid min-w-0 gap-2 sm:grid-cols-[100px_minmax(0,1fr)_auto]">
                  <input className="h-10 rounded-xl border border-line px-3 text-sm outline-none focus:border-primary" value={draft.score} onChange={(event) => setReviews({ ...reviews, [submission.id]: { ...draft, score: event.target.value } })} />
                  <input className="h-10 rounded-xl border border-line px-3 text-sm outline-none focus:border-primary" placeholder="Комментарий участнику" value={draft.comment} onChange={(event) => setReviews({ ...reviews, [submission.id]: { ...draft, comment: event.target.value } })} />
                  <button onClick={() => reviewSubmission(submission)} disabled={Boolean(pendingReviewId)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-muted">
                    <CheckCircle2 size={15} />
                    {pendingReviewId === submission.id ? "Сохраняю..." : "Оценить"}
                  </button>
                </div>
              </div>
            );
          })}
          {(details?.submissions ?? []).length === 0 && <p className="rounded-2xl bg-surface p-4 text-sm leading-6 text-muted">Решений на проверку пока нет.</p>}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Info icon={<MessageSquareText size={19} />} title="Обратная связь" text="Комментарий наставника сохраняется в истории проверки." />
        <Info icon={<ClipboardCheck size={19} />} title="Рейтинг" text="После оценки баллы участника обновляются в рейтинге интенсива." />
      </section>
    </div>
  );
}

function githubUsername(value: string) {
  return value.replace(/^https:\/\/github\.com\//, "@");
}

function Info({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-line bg-white p-5 shadow-panel">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-primary">{icon}</div>
      <h2 className="mt-4 text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
    </article>
  );
}
