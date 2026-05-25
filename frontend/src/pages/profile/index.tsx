import { apiRequest } from "@/shared/api/client";
import { apiUrl } from "@/shared/api/config";
import type { Session } from "@/shared/auth/session";
import { getAccessToken } from "@/shared/auth/session";
import { applicationStatusLabel } from "@/shared/lib/labels";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import {
  Bell,
  Building2,
  CheckCircle2,
  Clock3,
  Download,
  Edit2,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Lock,
  Save,
  Send,
  ShieldCheck,
  Upload,
  UserCheck,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type PartnerRequest = {
  id: string;
  organizationId?: string | null;
  companyName: string;
  contactEmail: string;
  description?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REWORK" | string;
  reviewReason?: string | null;
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

type Organization = {
  id: string;
  name: string;
  type: string;
  status: string;
  description?: string | null;
  inn?: string | null;
  ogrn?: string | null;
  docInnId?: string | null;
  docEgrulId?: string | null;
  docCharterId?: string | null;
  docPoaId?: string | null;
};

// ─── Inline text field ────────────────────────────────────────────────────────

function EditField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] font-semibold uppercase tracking-wider text-muted">{label}</span>
      <div className="relative">
        <input
          className="h-10 w-full rounded-xl border border-line bg-white px-3 text-[14px] text-ink outline-none transition placeholder:text-muted/40 focus:border-primary focus:ring-4 focus:ring-primary/8 pr-10"
          type={isPassword ? (show ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {hint && <p className="text-[11px] text-muted">{hint}</p>}
    </label>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-white shadow-card ${className}`}>
      {children}
    </div>
  );
}

// ─── StatusBox ────────────────────────────────────────────────────────────────

function StatusBox({ icon, title, text, tone }: { icon: React.ReactNode; title: string; text: string; tone: "success" | "warning" | "error" }) {
  const color = tone === "success" ? "bg-emerald-50 text-emerald-700" : tone === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700";
  return (
    <div className={`mt-4 rounded-2xl p-4 ${color}`}>
      <div className="flex items-center gap-2 font-semibold">{icon}{title}</div>
      <p className="mt-2 text-[13px] leading-5">{text}</p>
    </div>
  );
}

// ─── DocUploadSlot ────────────────────────────────────────────────────────────

function DocUploadSlot({
  name,
  desc,
  docType,
  fileId,
  organizationId,
  onUploaded,
}: {
  name: string;
  desc: string;
  docType: string;
  fileId?: string | null;
  organizationId: string;
  onUploaded: (updated: Organization) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      // 1. Upload the file to /api/files
      const formData = new FormData();
      formData.append("file", file);
      formData.append("accessLevel", "PRIVATE");
      const token = getAccessToken();
      const uploadRes = await fetch(`${apiUrl}/api/files`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Ошибка загрузки файла");
      const uploaded = await uploadRes.json() as { id: string };

      // 2. Link file to organization
      const org = await apiRequest<Organization>(`/api/organizations/${organizationId}/documents`, {
        method: "PATCH",
        body: JSON.stringify({ docType, fileId: uploaded.id }),
      });
      onUploaded(org);
      toastSuccess("Документ загружен", name);
    } catch (e) {
      toastError("Не удалось загрузить", e instanceof Error ? e.message : undefined);
    } finally {
      setUploading(false);
    }
  }

  const hasFile = !!fileId;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 text-left">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${hasFile ? "bg-emerald-50 text-emerald-600" : "bg-surface text-muted"}`}>
        <FileText size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-ink">{name}</p>
        <p className="text-[11px] text-muted">{desc}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {hasFile && (
          <a
            href={`${apiUrl}/api/files/${fileId}/content`}
            target="_blank"
            rel="noreferrer"
            className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-white text-muted transition hover:border-primary/30 hover:text-primary"
            title="Скачать"
          >
            <Download size={13} />
          </a>
        )}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition disabled:opacity-50
            ${hasFile ? "border border-line bg-white text-muted hover:border-primary/30 hover:text-ink" : "bg-primary text-white hover:opacity-90"}`}
          title={hasFile ? "Заменить" : "Загрузить"}
        >
          {uploading ? (
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </span>
          ) : (
            <><Upload size={11} />{hasFile ? "Заменить" : "Загрузить"}</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────

export function ProfilePage({ session, onSessionChange }: { session: Session | null; onSessionChange?: (s: Session) => void }) {
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [description, setDescription] = useState("");
  const [submittingPartnerRequest, setSubmittingPartnerRequest] = useState(false);
  const [acceptingInviteId, setAcceptingInviteId] = useState<string | null>(null);

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(session?.user.fullName ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const currentRequest = useMemo(() => requests.find((r) => r.organizationId === session?.user.organizationId), [requests, session?.user.organizationId]);
  const isPlatformOwner = session?.user.role === "ADMIN";
  const isPartnerManager = session?.user.role === "PARTNER_MANAGER";
  const pendingInvites = useMemo(() => invites.filter((i) => i.status === "PENDING"), [invites]);

  useEffect(() => {
    if (!session) return;
    apiRequest<PartnerRequest[]>("/api/organizations/partner-requests").then(setRequests).catch(() => undefined);
    apiRequest<Invite[]>(`/api/organizations/invites/mine?email=${encodeURIComponent(session.user.email)}`).then(setInvites).catch(() => undefined);
    if (session.user.organizationId) {
      apiRequest<Organization>(`/api/organizations/${session.user.organizationId}`).then(setOrganization).catch(() => undefined);
    }
  }, [session?.user.id]);

  async function saveProfile() {
    if (!editName.trim()) { toastError("Имя не может быть пустым"); return; }
    setSavingProfile(true);
    try {
      await apiRequest("/api/auth/profile", { method: "PATCH", body: JSON.stringify({ fullName: editName }) });
      // Update local session
      if (session && onSessionChange) {
        onSessionChange({ ...session, user: { ...session.user, fullName: editName } });
      }
      toastSuccess("Профиль обновлён");
      setEditingProfile(false);
    } catch (e) {
      toastError("Не удалось сохранить", e instanceof Error ? e.message : undefined);
    } finally { setSavingProfile(false); }
  }

  async function savePassword() {
    if (!currentPassword) { toastError("Введите текущий пароль"); return; }
    if (newPassword.length < 8) { toastError("Новый пароль минимум 8 символов"); return; }
    if (newPassword !== confirmPassword) { toastError("Пароли не совпадают"); return; }
    setSavingPassword(true);
    try {
      await apiRequest("/api/auth/profile", { method: "PATCH", body: JSON.stringify({ currentPassword, newPassword }) });
      toastSuccess("Пароль изменён", "Используйте новый пароль при следующем входе.");
      setChangingPassword(false);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e) {
      toastError("Не удалось изменить пароль", e instanceof Error ? e.message : undefined);
    } finally { setSavingPassword(false); }
  }

  async function submitPartnerRequest() {
    if (submittingPartnerRequest || !session?.user.organizationId) { toastError("Заявку можно подать только из аккаунта компании"); return; }
    setSubmittingPartnerRequest(true);
    try {
      const created = await apiRequest<PartnerRequest>("/api/organizations/partner-requests", {
        method: "POST",
        body: JSON.stringify({ organizationId: session.user.organizationId, contactEmail: session.user.email, description }),
      });
      setRequests([created, ...requests]);
      setDescription("");
      toastSuccess("Заявка отправлена", "Статус обновится в профиле.");
    } catch (e) {
      toastError("Не удалось отправить заявку", e instanceof Error ? e.message : undefined);
    } finally { setSubmittingPartnerRequest(false); }
  }

  async function acceptInvite(invite: Invite) {
    if (acceptingInviteId || !session) return;
    setAcceptingInviteId(invite.id);
    try {
      await apiRequest(`/api/organizations/invites/${invite.id}/accept`, { method: "POST", body: JSON.stringify({ userId: session.user.id, userEmail: session.user.email }) });
      setInvites((prev) => prev.map((i) => (i.id === invite.id ? { ...i, status: "ACCEPTED" } : i)));
      toastSuccess("Вы вступили в компанию!", `Теперь вы сотрудник «${invite.organizationName}». Перезайдите для обновления роли.`);
    } catch (e) {
      toastError("Не удалось принять инвайт", e instanceof Error ? e.message : undefined);
    } finally { setAcceptingInviteId(null); }
  }

  const roleLabel: Record<string, string> = {
    STUDENT: "Пользователь",
    CORPORATE_STUDENT: "Сотрудник компании",
    PARTNER_MANAGER: "Компания-партнёр",
    MENTOR: "Наставник",
    ADMIN: "Основная компания",
  };

  return (
    <div className="grid gap-5">

      {/* ── Personal info card ── */}
      <SectionCard>
        <div className="flex items-start justify-between gap-3 p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-light text-primary">
              <UserRound size={26} />
            </div>
            <div>
              <h1 className="text-[20px] font-bold tracking-tight text-ink">{session?.user.fullName ?? "Гость"}</h1>
              <p className="mt-0.5 text-[13px] text-muted">{session?.user.email}</p>
              <span className="mt-1.5 inline-block rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                {roleLabel[session?.user.role ?? ""] ?? session?.user.role}
              </span>
            </div>
          </div>
          <button
            onClick={() => { setEditName(session?.user.fullName ?? ""); setEditingProfile(!editingProfile); setChangingPassword(false); }}
            className={`shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-semibold transition ${editingProfile ? "border-primary/30 bg-primary/5 text-primary" : "border-line bg-surface text-muted hover:border-primary/30 hover:text-ink"}`}
          >
            {editingProfile ? <><X size={13} />Отмена</> : <><Edit2 size={13} />Редактировать</>}
          </button>
        </div>

        <AnimatePresence>
          {editingProfile && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-line"
            >
              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <EditField label="Имя и фамилия" value={editName} onChange={setEditName} placeholder="Иван Иванов" />
                <div className="flex items-end">
                  <button
                    onClick={saveProfile}
                    disabled={savingProfile}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-gradient text-[13px] font-semibold text-white shadow-red-sm transition hover:opacity-90 disabled:opacity-60"
                  >
                    <Save size={14} />
                    {savingProfile ? "Сохраняю..." : "Сохранить имя"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionCard>

      {/* ── Password change ── */}
      <SectionCard>
        <button
          onClick={() => { setChangingPassword(!changingPassword); setEditingProfile(false); }}
          className="flex w-full items-center justify-between gap-3 p-5 sm:p-6"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-muted">
              <KeyRound size={17} />
            </div>
            <div className="text-left">
              <p className="text-[14px] font-semibold text-ink">Безопасность</p>
              <p className="text-[12px] text-muted">Изменить пароль</p>
            </div>
          </div>
          <div className={`rounded-xl border px-3 py-1.5 text-[12px] font-semibold transition ${changingPassword ? "border-primary/30 bg-primary/5 text-primary" : "border-line text-muted"}`}>
            {changingPassword ? "Свернуть" : "Изменить"}
          </div>
        </button>

        <AnimatePresence>
          {changingPassword && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-line"
            >
              <div className="grid gap-3 p-5 sm:p-6">
                <EditField label="Текущий пароль" type="password" value={currentPassword} onChange={setCurrentPassword} placeholder="Текущий пароль" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <EditField label="Новый пароль" type="password" value={newPassword} onChange={setNewPassword} placeholder="Минимум 8 символов" hint="Не менее 8 символов" />
                  <EditField label="Подтверждение" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Повторите пароль" />
                </div>
                <button
                  onClick={savePassword}
                  disabled={savingPassword}
                  className="flex h-10 w-fit items-center gap-2 rounded-xl bg-red-gradient px-5 text-[13px] font-semibold text-white shadow-red-sm transition hover:opacity-90 disabled:opacity-60"
                >
                  <Lock size={14} />
                  {savingPassword ? "Меняю..." : "Изменить пароль"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionCard>

      {/* ── Company info (PARTNER_MANAGER) ── */}
      {isPartnerManager && organization && (
        <SectionCard>
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <Building2 size={17} />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-ink">Данные компании</h2>
                <p className="text-[12px] text-muted">{organization.name}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {[
                { label: "Название", value: organization.name },
                { label: "ИНН", value: organization.inn ?? "Не указан" },
                { label: "ОГРН", value: organization.ogrn ?? "Не указан" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-2xl bg-surface p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
                  <p className="mt-1 text-[13px] font-medium text-ink">{value}</p>
                </div>
              ))}
            </div>
            {organization.description && (
              <div className="mt-3 rounded-2xl bg-surface p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Описание</p>
                <p className="mt-1 text-[13px] text-ink leading-5">{organization.description}</p>
              </div>
            )}
          </div>

          {/* Documents section */}
          <div className="border-t border-line p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={15} className="text-muted" />
              <h3 className="text-[13px] font-semibold text-ink">Документы</h3>
              <span className="ml-auto text-[11px] text-muted">PDF, DOC, JPG — до 10 МБ</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <DocUploadSlot
                name="Свидетельство ИНН"
                desc="Подтверждение налогового номера"
                docType="inn"
                fileId={organization.docInnId}
                organizationId={organization.id}
                onUploaded={setOrganization}
              />
              <DocUploadSlot
                name="Выписка из ЕГРЮЛ"
                desc="Актуальная выписка (до 30 дней)"
                docType="egrul"
                fileId={organization.docEgrulId}
                organizationId={organization.id}
                onUploaded={setOrganization}
              />
              <DocUploadSlot
                name="Устав организации"
                desc="Действующая редакция устава"
                docType="charter"
                fileId={organization.docCharterId}
                organizationId={organization.id}
                onUploaded={setOrganization}
              />
              <DocUploadSlot
                name="Доверенность"
                desc="При наличии представителя"
                docType="poa"
                fileId={organization.docPoaId}
                organizationId={organization.id}
                onUploaded={setOrganization}
              />
            </div>
            <p className="mt-3 text-[11px] text-muted">
              Загруженные документы видны только администратору платформы.
            </p>
          </div>
        </SectionCard>
      )}

      {/* ── Pending invites ── */}
      {session && pendingInvites.length > 0 && (
        <SectionCard className="p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <Bell size={17} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-ink">Приглашения в компанию</h2>
              <p className="text-[12px] text-muted">Вам направлены инвайты от работодателей</p>
            </div>
            <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
              {pendingInvites.length}
            </span>
          </div>
          <div className="grid gap-3">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{invite.organizationName}</p>
                    {invite.message && <p className="mt-1 text-[13px] leading-5 text-muted italic">"{invite.message}"</p>}
                    <p className="mt-1 text-[11px] text-muted">{new Date(invite.createdAt).toLocaleDateString("ru-RU")}</p>
                  </div>
                  <button
                    onClick={() => acceptInvite(invite)}
                    disabled={acceptingInviteId === invite.id}
                    className="shrink-0 inline-flex h-9 items-center gap-1.5 rounded-xl bg-red-gradient px-3 text-[12px] font-semibold text-white shadow-red-sm transition hover:opacity-90 disabled:opacity-50"
                  >
                    <UserCheck size={13} />
                    {acceptingInviteId === invite.id ? "..." : "Принять"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Partnership ── */}
      <SectionCard className="p-5 sm:p-6">
        {isPlatformOwner ? (
          <>
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-light text-primary">
                <ShieldCheck size={17} />
              </div>
              <h2 className="text-[15px] font-semibold text-ink">Управление платформой</h2>
            </div>
            <p className="mt-3 text-[13px] leading-5 text-muted">
              Вы владелец платформы. Партнёрские заявки рассматриваются в административной панели.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-light text-primary">
                <Building2 size={17} />
              </div>
              <h2 className="text-[15px] font-semibold text-ink">Партнёрство</h2>
            </div>

            {isPartnerManager && organization?.type === "PARTNER" ? (
              /* ── Approved partner ── */
              <StatusBox icon={<CheckCircle2 size={18} />} title="Партнёрство одобрено" text="Вашей организации открыт кабинет партнёра и студия создания курсов." tone="success" />
            ) : currentRequest && currentRequest.status === "PENDING" ? (
              /* ── Request is pending review ── */
              <StatusBox
                icon={<Clock3 size={18} />}
                title="Заявка на рассмотрении"
                text="Ожидайте решения администратора. Мы уведомим вас о результате."
                tone="warning"
              />
            ) : currentRequest && currentRequest.status === "APPROVED" ? (
              /* ── Approved via request (role not yet updated — prompt to re-login) ── */
              <StatusBox
                icon={<CheckCircle2 size={18} />}
                title="Партнёрство одобрено"
                text="Перезайдите в систему, чтобы роль и доступы обновились."
                tone="success"
              />
            ) : currentRequest && (currentRequest.status === "REJECTED" || currentRequest.status === "REWORK") ? (
              /* ── Rejected or needs rework — show reason + resubmit form ── */
              <div>
                <StatusBox
                  icon={<Clock3 size={18} />}
                  title={currentRequest.status === "REJECTED" ? "Заявка отклонена" : "Заявка возвращена на доработку"}
                  text={currentRequest.status === "REJECTED"
                    ? "Администратор отклонил заявку. Вы можете подать повторную заявку с исправленными данными."
                    : "Администратор вернул заявку на доработку. Внесите правки и отправьте снова."}
                  tone={currentRequest.status === "REJECTED" ? "error" : "warning"}
                />
                {currentRequest.reviewReason && (
                  <div className="mt-3 rounded-2xl border border-line bg-surface p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1">Комментарий администратора</p>
                    <p className="text-[13px] text-ink leading-5">{currentRequest.reviewReason}</p>
                  </div>
                )}
                <div className="mt-4 grid gap-3">
                  <p className="text-[13px] text-muted">Исправьте описание и подайте повторную заявку:</p>
                  <label className="grid gap-1.5 text-[13px] font-medium text-ink">
                    Описание партнёрской программы
                    <textarea
                      className="min-h-24 rounded-xl border border-line px-3 py-2 text-[13px] outline-none transition focus:border-primary"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Исправленное описание с учётом комментария..."
                    />
                  </label>
                  <button
                    onClick={submitPartnerRequest}
                    disabled={submittingPartnerRequest}
                    className="inline-flex h-10 w-fit items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send size={14} />
                    {submittingPartnerRequest ? "Отправляю..." : "Подать повторно"}
                  </button>
                </div>
              </div>
            ) : session?.user.organizationId ? (
              /* ── Has company but no request yet (or PARTNER_MANAGER with CORPORATE_CLIENT type) ── */
              <div className="mt-4 grid gap-3">
                <p className="text-[13px] leading-5 text-muted">
                  Подайте заявку на партнёрство. После одобрения компания получит партнёрский статус и отдельный кабинет.
                </p>
                <label className="grid gap-1.5 text-[13px] font-medium text-ink">
                  Описание партнёрской программы
                  <textarea
                    className="min-h-24 rounded-xl border border-line px-3 py-2 text-[13px] outline-none transition focus:border-primary"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Расскажите о вашей компании и целях партнёрства..."
                  />
                </label>
                <button
                  onClick={submitPartnerRequest}
                  disabled={submittingPartnerRequest}
                  className="inline-flex h-10 w-fit items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={14} />
                  {submittingPartnerRequest ? "Отправляю..." : "Подать заявку"}
                </button>
              </div>
            ) : (
              <p className="mt-4 rounded-2xl bg-surface p-4 text-[13px] leading-5 text-muted">
                Индивидуальный пользователь не может подать заявку без компании.
              </p>
            )}
          </>
        )}
      </SectionCard>
    </div>
  );
}
