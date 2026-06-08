import type { Course } from "@/entities/course/model/types";
import type { Intensive } from "@/entities/intensive/model/types";
import { apiRequest } from "@/shared/api/client";
import { apiUrl } from "@/shared/api/config";
import type { Session } from "@/shared/auth/session";
import { getAccessToken } from "@/shared/auth/session";
import { courseStatusLabel, intensiveStatusLabel, memberRoleLabel } from "@/shared/lib/labels";
import { navigate } from "@/shared/router";
import { StatisticsExport } from "@/shared/ui/StatisticsExport";
import { StudioField } from "@/shared/ui/studio";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import {
  BookOpen,
  Building2,
  ClipboardCheck,
  Clock,
  FileText,
  Layers3,
  Loader2,
  Mail,
  Pencil,
  Save,
  Send,
  Trash2,
  Trophy,
  Upload,
  UserPlus,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type OrgData = {
  id: string;
  name: string;
  description?: string | null;
  inn?: string | null;
  ogrn?: string | null;
  docInnId?: string | null;
  docEgrulId?: string | null;
  docCharterId?: string | null;
  docPoaId?: string | null;
};

type CompanyMember = {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  status: string;
  email?: string | null;
  fullName?: string | null;
};

type Invite = {
  id: string;
  organizationId: string;
  organizationName: string;
  email: string;
  role: string;
  status: string;
  message?: string | null;
  createdAt: string;
};

const DOC_TYPES: { key: keyof OrgData; apiType: string; label: string; hint: string }[] = [
  { key: "docInnId", apiType: "inn", label: "Свидетельство ИНН", hint: "PDF, до 10 МБ" },
  { key: "docEgrulId", apiType: "egrul", label: "Выписка из ЕГРЮЛ", hint: "PDF, до 10 МБ" },
  { key: "docCharterId", apiType: "charter", label: "Устав организации", hint: "PDF, до 10 МБ" },
  { key: "docPoaId", apiType: "poa", label: "Доверенность", hint: "PDF, до 10 МБ" },
];

export function PartnerPage({
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
  const partnerCourses = courses.filter(
    (course) => course.authorType === "PARTNER" && course.organizationId === session?.user.organizationId,
  );
  const partnerIntensives = intensives.filter(
    (intensive) => intensive.organizerType === "PARTNER" && intensive.organizationId === session?.user.organizationId,
  );

  const [orgData, setOrgData] = useState<OrgData | null>(null);

  // Employees
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState("");

  // Company edit state
  const [editingCompany, setEditingCompany] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editInn, setEditInn] = useState("");
  const [editOgrn, setEditOgrn] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);

  useEffect(() => {
    if (!session?.user.organizationId) return;
    apiRequest<OrgData>(`/api/organizations/${session.user.organizationId}`)
      .then(setOrgData)
      .catch(() => {/* silent */});
    loadEmployees();
  }, [session?.user.organizationId]);

  async function loadEmployees() {
    if (!session?.user.organizationId) return;
    try {
      const [nextMembers, nextInvites] = await Promise.all([
        apiRequest<CompanyMember[]>(`/api/organizations/${session.user.organizationId}/members`),
        apiRequest<Invite[]>(`/api/organizations/${session.user.organizationId}/invites`),
      ]);
      setMembers(nextMembers);
      setInvites(nextInvites);
    } catch {/* silent */}
  }

  async function sendInvite() {
    if (sendingInvite) return;
    if (!inviteEmail.trim() || !session?.user.organizationId) {
      toastError("Укажите email сотрудника");
      return;
    }
    setSendingInvite(true);
    try {
      const created = await apiRequest<Invite>(`/api/organizations/${session.user.organizationId}/invites`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim(), message: inviteMessage.trim() || null }),
      });
      setInvites((prev) => [created, ...prev]);
      setInviteEmail("");
      setInviteMessage("");
      toastSuccess("Приглашение создано", `Сотруднику ${created.email} нужно войти в профиль и принять инвайт.`);
    } catch (e) {
      toastError("Не удалось отправить приглашение", e instanceof Error ? e.message : undefined);
    } finally {
      setSendingInvite(false);
    }
  }

  async function removeMember(member: CompanyMember) {
    if (removingMemberId || !session?.user.organizationId) return;
    if (!confirm(`Удалить сотрудника ${member.fullName || member.email || ""} из компании?`)) return;
    setRemovingMemberId(member.userId);
    try {
      await apiRequest(`/api/organizations/${session.user.organizationId}/members/${member.userId}`, { method: "DELETE" });
      setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
      toastSuccess("Сотрудник удалён", "Пользователь откреплён от компании.");
    } catch (e) {
      toastError("Не удалось удалить сотрудника", e instanceof Error ? e.message : undefined);
    } finally {
      setRemovingMemberId("");
    }
  }

  function startEdit() {
    setEditName(orgData?.name ?? "");
    setEditDescription(orgData?.description ?? "");
    setEditInn(orgData?.inn ?? "");
    setEditOgrn(orgData?.ogrn ?? "");
    setEditingCompany(true);
  }

  async function saveCompany() {
    if (!session?.user.organizationId || savingCompany) return;
    setSavingCompany(true);
    try {
      const updated = await apiRequest<OrgData>(`/api/organizations/${session.user.organizationId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName.trim() || undefined,
          description: editDescription.trim() || undefined,
          inn: editInn.trim() || undefined,
          ogrn: editOgrn.trim() || undefined,
        }),
      });
      setOrgData(updated);
      setEditingCompany(false);
      toastSuccess("Данные компании обновлены");
    } catch (e) {
      toastError("Не удалось сохранить данные", e instanceof Error ? e.message : undefined);
    } finally {
      setSavingCompany(false);
    }
  }

  async function updateDoc(docType: string, fileId: string | null) {
    if (!session?.user.organizationId) return;
    try {
      const updated = await apiRequest<OrgData>(`/api/organizations/${session.user.organizationId}/documents`, {
        method: "PATCH",
        body: JSON.stringify({ docType, fileId }),
      });
      setOrgData(updated);
    } catch (e) {
      toastError("Не удалось обновить документ", e instanceof Error ? e.message : undefined);
    }
  }

  return (
    <div className="grid gap-5">
      <Header title="Кабинет партнера" text="Партнерский кабинет разделен на понятные рабочие зоны: создание контента, материалы, интенсивы и проверка участников." />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-3xl border border-line bg-white p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-primary">
              <Layers3 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">Студия образовательного продукта</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Партнер создает и редактирует контент в разделе "Мои курсы", без доступа к кабинету корпоративного клиента.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <ActionCard
              icon={<BookOpen size={20} />}
              title="Мои курсы"
              text="Создание, редактирование, публикация и скрытие партнерских курсов."
              onClick={() => navigate("/my-courses")}
            />
            <ActionCard
              icon={<Trophy size={20} />}
              title="Мои интенсивы"
              text="Дата старта, этапы, задания и менеджеры из сотрудников организации."
              onClick={() => navigate("/my-courses")}
            />
          </div>
        </div>

        <aside className="rounded-3xl border border-line bg-white p-5 shadow-panel">
          <ClipboardCheck className="text-primary" />
          <h2 className="mt-4 text-lg font-semibold text-ink">Рабочий процесс</h2>
          <div className="mt-4 grid gap-3 text-sm text-muted">
            <p className="rounded-2xl bg-surface p-3">Создавайте курсы и интенсивы в разделе "Мои курсы".</p>
            <p className="rounded-2xl bg-surface p-3">Публикуйте материалы после подготовки программы.</p>
            <p className="rounded-2xl bg-surface p-3">Участники и результаты доступны на страницах программ.</p>
          </div>
        </aside>
      </section>

      {/* Company data */}
      {orgData && (
        <div className="rounded-3xl border border-line bg-white p-5 shadow-panel">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-primary">
                <Building2 size={18} />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-ink">Данные компании</h2>
                <p className="text-[12px] text-muted">{orgData.name}</p>
              </div>
            </div>
            {!editingCompany && (
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-[12px] font-medium text-muted transition hover:border-primary hover:text-primary"
              >
                <Pencil size={12} />
                Редактировать
              </button>
            )}
          </div>

          {editingCompany ? (
            <div className="grid gap-3">
              <StudioField label="Название компании" value={editName} onChange={setEditName} />
              <div className="grid gap-3 sm:grid-cols-2">
                <StudioField label="ИНН" value={editInn} onChange={setEditInn} />
                <StudioField label="ОГРН" value={editOgrn} onChange={setEditOgrn} />
              </div>
              <label className="grid gap-1.5 text-sm font-medium text-ink">
                Описание
                <textarea
                  className="min-h-20 rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Описание компании..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </label>
              <div className="flex gap-2">
                <button
                  onClick={saveCompany}
                  disabled={savingCompany}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-semibold text-white disabled:opacity-50"
                >
                  <Save size={13} />
                  {savingCompany ? "Сохранение..." : "Сохранить"}
                </button>
                <button
                  onClick={() => setEditingCompany(false)}
                  className="inline-flex h-9 items-center px-4 rounded-xl border border-line text-[13px] text-muted"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-2 text-[13px]">
              {orgData.inn ? (
                <div className="flex justify-between border-b border-line pb-1.5">
                  <span className="text-muted">ИНН</span>
                  <span className="font-medium text-ink">{orgData.inn}</span>
                </div>
              ) : (
                <div className="flex justify-between border-b border-line pb-1.5">
                  <span className="text-muted">ИНН</span>
                  <span className="italic text-muted">Не указан</span>
                </div>
              )}
              {orgData.ogrn ? (
                <div className="flex justify-between border-b border-line pb-1.5">
                  <span className="text-muted">ОГРН</span>
                  <span className="font-medium text-ink">{orgData.ogrn}</span>
                </div>
              ) : (
                <div className="flex justify-between border-b border-line pb-1.5">
                  <span className="text-muted">ОГРН</span>
                  <span className="italic text-muted">Не указан</span>
                </div>
              )}
              {orgData.description && <p className="text-[12px] text-muted">{orgData.description}</p>}
              {!orgData.inn && !orgData.ogrn && !orgData.description && (
                <p className="text-[12px] italic text-muted">Нажмите «Редактировать» чтобы заполнить данные</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Employees */}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Invite */}
        <div className="rounded-3xl border border-line bg-white p-5 shadow-panel">
          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-primary">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-ink">Пригласить сотрудника</h2>
              <p className="text-[12px] text-muted">Инвайт появится в профиле пользователя</p>
            </div>
          </div>
          <div className="rounded-2xl bg-surface p-4">
            <div className="grid gap-3">
              <StudioField label="Email сотрудника" value={inviteEmail} onChange={setInviteEmail} />
              <label className="grid gap-1.5 text-sm font-medium text-ink">
                Сообщение (необязательно)
                <textarea
                  className="min-h-16 rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Добро пожаловать в команду!"
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                />
              </label>
              <button
                onClick={sendInvite}
                disabled={sendingInvite || !inviteEmail.trim()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-gradient px-5 text-sm font-semibold text-white shadow-red-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={15} />
                {sendingInvite ? "Отправляю..." : "Отправить приглашение"}
              </button>
            </div>
          </div>

          {invites.filter((i) => i.status === "PENDING").length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-muted">
                Ожидают принятия ({invites.filter((i) => i.status === "PENDING").length})
              </p>
              <div className="grid gap-2">
                {invites.filter((i) => i.status === "PENDING").map((inv) => (
                  <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-line bg-amber-50/50 p-3">
                    <Mail size={14} className="shrink-0 text-amber-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">{inv.email}</p>
                      <p className="flex items-center gap-1 text-[11px] text-muted">
                        <Clock size={10} />
                        {new Date(inv.createdAt).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">Ожидание</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Members list */}
        <aside className="rounded-3xl border border-line bg-white p-5 shadow-panel">
          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-primary">
              <Users size={17} />
            </div>
            <h2 className="text-[15px] font-semibold text-ink">
              Сотрудники ({members.filter((m) => m.status === "ACTIVE").length})
            </h2>
          </div>
          {members.filter((m) => m.status === "ACTIVE").length === 0 ? (
            <p className="rounded-2xl bg-surface p-3 text-[13px] text-muted">Сотрудники появятся после принятия инвайтов.</p>
          ) : (
            <div className="grid gap-2">
              {members.filter((m) => m.status === "ACTIVE").map((member) => (
                <div key={member.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-light text-[12px] font-bold text-primary">
                    {(member.fullName || member.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{member.fullName || "Сотрудник"}</p>
                    {member.email && <p className="truncate text-[11px] text-muted">{member.email}</p>}
                  </div>
                  <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-muted">
                    {memberRoleLabel(member.role)}
                  </span>
                  <button
                    onClick={() => removeMember(member)}
                    disabled={Boolean(removingMemberId)}
                    title="Удалить из компании"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-line text-muted transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </aside>
      </section>

      {/* Course-completion statistics (scoped to this company by the backend) */}
      <StatisticsExport title="Статистика моих сотрудников и курсов" />

      {/* Documents */}
      {orgData && (
        <div className="rounded-3xl border border-line bg-white p-5 shadow-panel">
          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-red-50 text-primary">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-ink">Документы организации</h2>
              <p className="text-[12px] text-muted">Загрузите юридические документы для верификации партнера</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {DOC_TYPES.map((doc) => (
              <DocSlot
                key={doc.key}
                label={doc.label}
                hint={doc.hint}
                fileId={orgData[doc.key] as string | null | undefined}
                docType={doc.apiType}
                onUpdate={updateDoc}
              />
            ))}
          </div>
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-3xl border border-line bg-white p-5 shadow-panel">
          <h2 className="text-lg font-semibold text-ink">Мои материалы</h2>
          <div className="mt-4 grid gap-3">
            {partnerCourses.map((course) => (
              <button
                key={course.id}
                onClick={() => navigate(`/courses/${course.id}`)}
                className="rounded-2xl border border-line p-4 text-left hover:border-red-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-ink">{course.title}</h3>
                  <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-muted">
                    {course.courseType === "COMPANY" ? "Курс компании" : "Обычный"} · {courseStatusLabel(course.status)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{course.description}</p>
              </button>
            ))}
            {partnerCourses.length === 0 && (
              <p className="rounded-2xl bg-surface p-4 text-sm leading-6 text-muted">Созданные курсы партнера появятся здесь.</p>
            )}
          </div>
        </div>
        <aside className="rounded-3xl border border-line bg-white p-5 shadow-panel">
          <h2 className="text-lg font-semibold text-ink">Интенсивы партнера</h2>
          <div className="mt-4 grid gap-3">
            {partnerIntensives.slice(0, 5).map((intensive) => (
              <button
                key={intensive.id}
                onClick={() => navigate(`/intensives/${intensive.id}`)}
                className="rounded-2xl border border-line p-3 text-left hover:border-red-200"
              >
                <p className="text-sm font-semibold text-ink">{intensive.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {intensiveStatusLabel(intensive.status)} · лимит {intensive.participantLimit}
                </p>
              </button>
            ))}
            {partnerIntensives.length === 0 && (
              <p className="rounded-2xl bg-surface p-3 text-sm text-muted">Созданные интенсивы появятся здесь.</p>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}

// ─── Document slot ────────────────────────────────────────────────────────────

function DocSlot({
  label,
  hint,
  fileId,
  docType,
  onUpdate,
}: {
  label: string;
  hint: string;
  fileId?: string | null;
  docType: string;
  onUpdate: (docType: string, fileId: string | null) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toastError("Размер файла не должен превышать 10 МБ");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("accessLevel", "PRIVATE");
      const token = getAccessToken();
      const res = await fetch(`${apiUrl}/api/files`, {
        method: "POST",
        body: form,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Ошибка загрузки файла");
      const dto: { id: string } = await res.json();
      await onUpdate(docType, dto.id);
      toastSuccess(`«${label}» загружен`);
    } catch (e) {
      toastError("Не удалось загрузить файл", e instanceof Error ? e.message : undefined);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await onUpdate(docType, null);
      toastSuccess(`«${label}» удалён`);
    } catch {
      // error already shown in onUpdate
    } finally {
      setDeleting(false);
    }
  }

  const busy = uploading || deleting;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${fileId ? "bg-emerald-50 text-emerald-600" : "bg-white text-muted"} border border-line`}>
            <FileText size={15} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-ink">{label}</p>
            <p className="text-[11px] text-muted">{fileId ? "Загружен" : hint}</p>
          </div>
        </div>
        {fileId && !busy && (
          <button
            onClick={handleDelete}
            title="Удалить документ"
            className="shrink-0 grid h-7 w-7 place-items-center rounded-lg border border-line text-muted transition hover:border-red-300 hover:bg-red-50 hover:text-primary"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        {fileId && (
          <a
            href={`${apiUrl}/api/files/${fileId}/content`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12px] font-medium text-ink transition hover:border-primary hover:text-primary"
          >
            <FileText size={12} />
            Открыть
          </a>
        )}
        <button
          onClick={() => !busy && inputRef.current?.click()}
          disabled={busy}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12px] font-medium text-ink transition hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Upload size={12} />
          )}
          {uploading ? "Загрузка..." : fileId ? "Заменить" : "Загрузить"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function ActionCard({ icon, title, text, onClick }: { icon: ReactNode; title: string; text: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-line bg-white p-4 text-left transition hover:border-red-200 hover:bg-red-50/40">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-primary">{icon}</div>
      <h3 className="mt-4 font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
    </button>
  );
}

function Header({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-5 shadow-panel sm:p-6">
      <div className="flex items-center gap-3">
        <UsersRound className="shrink-0 text-primary" size={24} />
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{text}</p>
    </section>
  );
}
