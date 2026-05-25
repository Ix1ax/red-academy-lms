import type { Course } from "@/entities/course/model/types";
import type { Intensive } from "@/entities/intensive/model/types";
import { apiRequest } from "@/shared/api/client";
import type { Session } from "@/shared/auth/session";
import { applicationStatusLabel, courseStatusLabel, intensiveStatusLabel, memberRoleLabel } from "@/shared/lib/labels";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  Download,
  EyeOff,
  FileText,
  GraduationCap,
  Layers,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trophy,
  UserPlus,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

type AdminUser = { id: string; email: string; fullName: string; role: string; organizationId?: string | null };
type Organization = {
  id: string; name: string; type: string; status: string;
  description?: string | null; inn?: string | null; ogrn?: string | null;
  docInnId?: string | null; docEgrulId?: string | null; docCharterId?: string | null; docPoaId?: string | null;
};
type OrgMember = { id: string; userId: string; role: string; status: string; email?: string | null; fullName?: string | null };
type PartnerRequest = {
  id: string;
  organizationId?: string | null;
  companyName: string;
  contactEmail: string;
  status: string;
  description?: string | null;
  reviewReason?: string | null;
};

const TABS = [
  { key: "overview",   label: "Обзор",        icon: BarChart3 },
  { key: "users",      label: "Пользователи", icon: UsersRound },
  { key: "orgs",       label: "Организации",  icon: Building2 },
  { key: "requests",   label: "Заявки",       icon: Layers },
  { key: "courses",    label: "Курсы",        icon: BookOpen },
  { key: "intensives", label: "Интенсивы",    icon: Trophy },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const ROLE_ORDER = ["ADMIN", "PARTNER_MANAGER", "MENTOR", "STUDENT", "CORPORATE_STUDENT"];

const DOC_LABEL: Record<string, string> = {
  docInnId: "Свидетельство ИНН",
  docEgrulId: "Выписка из ЕГРЮЛ",
  docCharterId: "Устав организации",
  docPoaId: "Доверенность",
};

function DocLinks({ org }: { org: Organization }) {
  const docs = (["docInnId", "docEgrulId", "docCharterId", "docPoaId"] as const)
    .map((key) => ({ key, id: org[key] }))
    .filter((d) => d.id);
  if (!docs.length) return <p className="text-[12px] text-muted italic">Документы не загружены</p>;
  return (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {docs.map(({ key, id }) => (
        <a
          key={key}
          href={`/api/files/${id}/content`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-[12px] font-medium text-ink transition hover:border-primary hover:text-primary"
        >
          <Download size={12} className="shrink-0" />
          <span className="truncate">{DOC_LABEL[key]}</span>
        </a>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-xl bg-surface p-3 text-center text-[13px] text-muted">{text}</p>;
}

export function AdminPage({ courses, intensives, session }: { courses: Course[]; intensives: Intensive[]; session: Session | null }) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [partnerRequests, setPartnerRequests] = useState<PartnerRequest[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>(courses);
  const [allIntensives, setAllIntensives] = useState<Intensive[]>(intensives);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState("");

  const [reviewModal, setReviewModal] = useState<{ id: string; action: "reject" | "rework" } | null>(null);
  const [reviewReason, setReviewReason] = useState("");

  const [docModal, setDocModal] = useState<Organization | null>(null);

  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);
  const [orgMembers, setOrgMembers] = useState<Record<string, OrgMember[]>>({});

  const [addUserModal, setAddUserModal] = useState<{ orgId: string; orgName: string } | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<AdminUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [addingUserId, setAddingUserId] = useState("");
  const [addUserRole, setAddUserRole] = useState("CORPORATE_STUDENT");

  async function load() {
    if (loading) return;
    setLoading(true);
    try {
      const coursePath = session?.user.organizationId
        ? `/api/courses?status=ALL&organizationId=${session.user.organizationId}`
        : "/api/courses?status=ALL";
      const [usersRes, orgsRes, requestsRes, coursesRes, intensivesRes] = await Promise.allSettled([
        apiRequest<AdminUser[]>("/api/users"),
        apiRequest<Organization[]>("/api/organizations"),
        apiRequest<PartnerRequest[]>("/api/organizations/partner-requests"),
        apiRequest<Course[]>(coursePath),
        apiRequest<Intensive[]>("/api/intensives"),
      ]);
      if (usersRes.status === "fulfilled") setUsers(usersRes.value);
      if (orgsRes.status === "fulfilled") setOrganizations(orgsRes.value);
      if (requestsRes.status === "fulfilled") setPartnerRequests(requestsRes.value);
      if (coursesRes.status === "fulfilled") setAllCourses(coursesRes.value);
      if (intensivesRes.status === "fulfilled") setAllIntensives(intensivesRes.value);
    } finally {
      setLoading(false);
    }
  }

  async function loadOrgMembers(orgId: string) {
    try {
      const members = await apiRequest<OrgMember[]>(`/api/organizations/${orgId}/members`);
      setOrgMembers((prev) => ({ ...prev, [orgId]: members }));
    } catch { /* silent */ }
  }

  function toggleOrg(orgId: string) {
    if (expandedOrgId === orgId) {
      setExpandedOrgId(null);
    } else {
      setExpandedOrgId(orgId);
      if (!orgMembers[orgId]) loadOrgMembers(orgId);
    }
  }

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!userSearch.trim()) { setUserSearchResults([]); return; }
      setSearchingUsers(true);
      try {
        const res = await apiRequest<AdminUser[]>(`/api/users/search?q=${encodeURIComponent(userSearch)}`);
        setUserSearchResults(res);
      } catch { /* silent */ } finally { setSearchingUsers(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  async function addUserToOrg(userId: string) {
    if (!addUserModal) return;
    setAddingUserId(userId);
    try {
      await apiRequest(`/api/organizations/${addUserModal.orgId}/members`, {
        method: "POST",
        body: JSON.stringify({ userId, role: addUserRole }),
      });
      toastSuccess("Пользователь добавлен", `Теперь он является сотрудником компании ${addUserModal.orgName}`);
      loadOrgMembers(addUserModal.orgId);
      setAddUserModal(null);
      setUserSearch("");
      setUserSearchResults([]);
      await load();
    } catch (e) {
      toastError("Ошибка", e instanceof Error ? e.message : undefined);
    } finally {
      setAddingUserId("");
    }
  }

  async function approvePartner(id: string) {
    if (pendingAction) return;
    setPendingAction(`partner:${id}`);
    try {
      await apiRequest(`/api/organizations/partner-requests/${id}/approve`, { method: "POST" });
      toastSuccess("Заявка одобрена", "Компания получила статус партнёра.");
      await load();
    } catch (e) { toastError("Ошибка", e instanceof Error ? e.message : undefined); }
    finally { setPendingAction(""); }
  }

  async function reviewPartner(id: string, action: "reject" | "rework", reason: string) {
    if (pendingAction) return;
    setPendingAction(`partner:${id}`);
    try {
      await apiRequest(`/api/organizations/partner-requests/${id}/${action}`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      toastSuccess(action === "reject" ? "Заявка отклонена" : "Заявка возвращена на доработку");
      setReviewModal(null);
      setReviewReason("");
      await load();
    } catch (e) { toastError("Ошибка", e instanceof Error ? e.message : undefined); }
    finally { setPendingAction(""); }
  }

  async function setCourseStatus(id: string, status: "PUBLISHED" | "HIDDEN") {
    if (pendingAction) return;
    setPendingAction(`course:${id}`);
    try {
      const updated = await apiRequest<Course>(`/api/courses/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setAllCourses((cs) => cs.map((c) => (c.id === updated.id ? updated : c)));
      toastSuccess(status === "PUBLISHED" ? "Курс опубликован" : "Курс скрыт");
    } catch (e) { toastError("Ошибка", e instanceof Error ? e.message : undefined); }
    finally { setPendingAction(""); }
  }

  async function setIntensiveStatus(id: string, status: "ENROLLMENT_OPEN" | "HIDDEN") {
    if (pendingAction) return;
    setPendingAction(`intensive:${id}`);
    try {
      const updated = await apiRequest<Intensive>(`/api/intensives/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setAllIntensives((is) => is.map((i) => (i.id === updated.id ? updated : i)));
      toastSuccess(status === "ENROLLMENT_OPEN" ? "Интенсив открыт" : "Скрыт");
    } catch (e) { toastError("Ошибка", e instanceof Error ? e.message : undefined); }
    finally { setPendingAction(""); }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { setAllIntensives(intensives); }, [intensives]);

  const roleBreakdown = ROLE_ORDER.map((role) => ({ role, count: users.filter((u) => u.role === role).length })).filter((r) => r.count > 0);
  const coursesByStatus = ["PUBLISHED", "DRAFT", "MODERATION", "HIDDEN"].map((s) => ({ status: s, count: allCourses.filter((c) => c.status === s).length })).filter((s) => s.count > 0);
  const pendingRequests = partnerRequests.filter((r) => r.status === "PENDING");
  const companyOrgs = organizations.filter((o) => ["COMPANY", "CORPORATE_CLIENT", "PARTNER"].includes(o.type));

  function getOrgForRequest(req: PartnerRequest): Organization | undefined {
    return req.organizationId ? organizations.find((o) => o.id === req.organizationId) : undefined;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid gap-5">
      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-white p-6 shadow-panel">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-primary">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Административная панель</h1>
            <p className="text-[13px] text-muted">Управление платформой РедАкадемии</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex h-9 items-center gap-2 rounded-xl border border-line px-4 text-[13px] font-medium text-ink transition hover:border-primary hover:text-primary disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Загрузка..." : "Обновить"}
        </button>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: <UsersRound size={20} />, label: "Пользователи", value: users.length, sub: `${users.filter(u => ["STUDENT","CORPORATE_STUDENT"].includes(u.role)).length} студентов` },
          { icon: <Building2 size={20} />, label: "Организации", value: organizations.length, sub: `${companyOrgs.length} компаний` },
          { icon: <BookOpen size={20} />, label: "Курсы", value: allCourses.length, sub: `${allCourses.filter(c => c.status === "PUBLISHED").length} опубликовано` },
          { icon: <Trophy size={20} />, label: "Интенсивы", value: allIntensives.length, sub: `${allIntensives.filter(i => ["ENROLLMENT_OPEN","REGISTRATION_OPEN"].includes(i.status)).length} активных` },
        ].map(({ icon, label, value, sub }) => (
          <article key={label} className="rounded-2xl border border-line bg-white p-5 shadow-panel">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-primary">{icon}</div>
            <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
            <p className="text-[13px] font-medium text-muted">{label}</p>
            <p className="mt-0.5 text-[11px] text-muted">{sub}</p>
          </article>
        ))}
      </section>

      {/* Tab bar */}
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-1 rounded-2xl border border-line bg-white p-1.5 shadow-panel">
          {TABS.map(({ key, label, icon: Icon }) => {
            const badge = key === "requests" ? pendingRequests.length : 0;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative flex h-9 items-center gap-2 rounded-xl px-4 text-[13px] font-medium transition-all ${
                  tab === key ? "bg-red-gradient text-white shadow-red-sm" : "text-muted hover:bg-primary-light hover:text-primary"
                }`}
              >
                <Icon size={14} className="shrink-0" />
                {label}
                {badge > 0 && (
                  <span className={`ml-0.5 rounded-full px-1.5 text-[10px] font-bold ${tab === key ? "bg-white/30 text-white" : "bg-primary text-white"}`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-2xl border border-line bg-white p-5 shadow-panel">
                <h2 className="mb-4 flex items-center gap-2 text-[14px] font-semibold text-ink">
                  <BarChart3 size={15} className="text-primary" />Аналитика и отчётность
                </h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-muted">Пользователи по ролям</p>
                    <div className="grid gap-1.5">
                      {roleBreakdown.map(({ role, count }) => (
                        <div key={role} className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                            <div className="h-full rounded-full bg-red-gradient" style={{ width: `${Math.round((count / users.length) * 100)}%` }} />
                          </div>
                          <span className="w-36 text-[12px] text-muted">{memberRoleLabel(role)}</span>
                          <span className="w-6 text-right text-[12px] font-semibold text-ink">{count}</span>
                        </div>
                      ))}
                      {roleBreakdown.length === 0 && <p className="text-[12px] text-muted">Нет данных</p>}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-muted">Курсы по статусу</p>
                    <div className="grid gap-1.5">
                      {coursesByStatus.map(({ status, count }) => (
                        <div key={status} className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                            <div className="h-full rounded-full bg-red-gradient" style={{ width: allCourses.length ? `${Math.round((count / allCourses.length) * 100)}%` : "0%" }} />
                          </div>
                          <span className="w-28 text-[12px] text-muted">{courseStatusLabel(status)}</span>
                          <span className="w-6 text-right text-[12px] font-semibold text-ink">{count}</span>
                        </div>
                      ))}
                      {coursesByStatus.length === 0 && <p className="text-[12px] text-muted">Нет данных</p>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-line bg-white p-5 shadow-panel">
                <h2 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-ink">
                  <GraduationCap size={15} className="text-primary" />Сводка платформы
                </h2>
                <div className="grid gap-2 text-[13px]">
                  {[
                    ["Студентов", users.filter(u => ["STUDENT","CORPORATE_STUDENT"].includes(u.role)).length],
                    ["Наставников", users.filter(u => u.role === "MENTOR").length],
                    ["Партнёров", users.filter(u => u.role === "PARTNER_MANAGER").length],
                    ["Компаний", companyOrgs.length],
                    ["Курсов публичных", allCourses.filter(c => c.courseType === "PUBLIC").length],
                    ["Курсов корпоративных", allCourses.filter(c => c.courseType === "COMPANY").length],
                    ["Заявок на рассмотрении", pendingRequests.length],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="flex items-center justify-between border-b border-line pb-1.5 last:border-0 last:pb-0">
                      <span className="text-muted">{k}</span>
                      <span className="font-semibold text-ink">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {tab === "users" && (
            <div className="rounded-2xl border border-line bg-white p-5 shadow-panel">
              <h2 className="mb-4 text-[15px] font-semibold text-ink">Пользователи ({users.length})</h2>
              <div className="grid gap-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-light text-primary text-[13px] font-bold">
                      {user.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{user.fullName}</p>
                      <p className="truncate text-[12px] text-muted">{user.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-muted">{memberRoleLabel(user.role)}</span>
                      {user.organizationId && (
                        <span className="text-[10px] text-muted">{organizations.find(o => o.id === user.organizationId)?.name ?? "орг."}</span>
                      )}
                    </div>
                  </div>
                ))}
                {users.length === 0 && <EmptyState text="Пользователи не загружены" />}
              </div>
            </div>
          )}

          {/* ── ORGANIZATIONS ── */}
          {tab === "orgs" && (
            <div className="rounded-2xl border border-line bg-white p-5 shadow-panel">
              <h2 className="mb-4 text-[15px] font-semibold text-ink">Организации ({organizations.length})</h2>
              <div className="grid gap-3">
                {organizations.map((org) => (
                  <div key={org.id} className="overflow-hidden rounded-xl border border-line">
                    <div className="flex flex-wrap items-center gap-3 p-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-50 text-primary">
                        <Building2 size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-ink">{org.name}</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted">{org.type}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${org.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-surface text-muted"}`}>{org.status}</span>
                          {org.inn && <span className="text-[11px] text-muted">ИНН: {org.inn}</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap shrink-0 gap-2">
                        {(org.docInnId || org.docEgrulId || org.docCharterId || org.docPoaId) && (
                          <button
                            onClick={() => setDocModal(org)}
                            className="flex items-center gap-1.5 rounded-xl border border-line px-2.5 py-1.5 text-[11px] font-medium text-muted transition hover:border-primary hover:text-primary"
                          >
                            <FileText size={11} />Документы
                          </button>
                        )}
                        <button
                          onClick={() => { setAddUserModal({ orgId: org.id, orgName: org.name }); setUserSearch(""); setUserSearchResults([]); setAddUserRole("CORPORATE_STUDENT"); }}
                          className="flex items-center gap-1.5 rounded-xl border border-line px-2.5 py-1.5 text-[11px] font-medium text-muted transition hover:border-primary hover:text-primary"
                        >
                          <UserPlus size={11} />Добавить
                        </button>
                        <button
                          onClick={() => toggleOrg(org.id)}
                          className="flex items-center gap-1.5 rounded-xl border border-line px-2.5 py-1.5 text-[11px] font-medium text-muted transition hover:border-primary hover:text-primary"
                        >
                          <UsersRound size={11} />Сотрудники
                          <motion.span animate={{ rotate: expandedOrgId === org.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown size={11} />
                          </motion.span>
                        </button>
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {expandedOrgId === org.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden border-t border-line"
                        >
                          <div className="p-3">
                            {!orgMembers[org.id] ? (
                              <p className="text-[12px] text-muted">Загрузка...</p>
                            ) : orgMembers[org.id].length === 0 ? (
                              <p className="text-[12px] text-muted italic">Сотрудников пока нет</p>
                            ) : (
                              <div className="grid gap-1.5">
                                {orgMembers[org.id].map((m) => (
                                  <div key={m.id} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2">
                                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-light text-[11px] font-bold text-primary">
                                      {(m.fullName || m.email || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-[12px] font-semibold text-ink">{m.fullName || "—"}</p>
                                      {m.email && <p className="truncate text-[11px] text-muted">{m.email}</p>}
                                    </div>
                                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-muted border border-line">{memberRoleLabel(m.role)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
                {organizations.length === 0 && <EmptyState text="Организации не загружены" />}
              </div>
            </div>
          )}

          {/* ── PARTNER REQUESTS ── */}
          {tab === "requests" && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-2xl border border-line bg-white p-5 shadow-panel">
                <h2 className="mb-4 text-[15px] font-semibold text-ink">Все заявки ({partnerRequests.length})</h2>
                <div className="grid gap-3">
                  {partnerRequests.map((req) => {
                    const org = getOrgForRequest(req);
                    const hasAnyDoc = org && (org.docInnId || org.docEgrulId || org.docCharterId || org.docPoaId);
                    return (
                      <div key={req.id} className="rounded-xl border border-line p-4">
                        <div className="flex flex-wrap items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[14px] font-semibold text-ink">{req.companyName}</p>
                            <p className="mt-0.5 text-[12px] text-muted">{req.contactEmail}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            req.status === "PENDING" ? "bg-amber-50 text-amber-700" :
                            req.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" :
                            req.status === "REJECTED" ? "bg-red-50 text-red-700" :
                            "bg-surface text-muted"
                          }`}>
                            {applicationStatusLabel(req.status)}
                          </span>
                        </div>
                        {req.description && <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-muted italic">{req.description}</p>}
                        {req.reviewReason && <p className="mt-1 text-[11px] text-muted">Причина: «{req.reviewReason}»</p>}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {hasAnyDoc && (
                            <button
                              onClick={() => org && setDocModal(org)}
                              className="flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-[12px] font-medium text-muted transition hover:border-primary hover:text-primary"
                            >
                              <FileText size={12} />Документы компании
                            </button>
                          )}
                          {req.status === "PENDING" && (
                            <>
                              <button onClick={() => approvePartner(req.id)} disabled={Boolean(pendingAction)} className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-primary px-3 text-[12px] font-medium text-white disabled:opacity-50">
                                <CheckCircle2 size={12} />{pendingAction === `partner:${req.id}` ? "..." : "Одобрить"}
                              </button>
                              <button onClick={() => { setReviewModal({ id: req.id, action: "rework" }); setReviewReason(""); }} disabled={Boolean(pendingAction)} title="На доработку" className="h-8 w-8 flex items-center justify-center rounded-xl border border-line text-muted transition hover:border-amber-300 hover:text-amber-600 disabled:opacity-50">
                                <RotateCcw size={13} />
                              </button>
                              <button onClick={() => { setReviewModal({ id: req.id, action: "reject" }); setReviewReason(""); }} disabled={Boolean(pendingAction)} title="Отклонить" className="h-8 w-8 flex items-center justify-center rounded-xl border border-line text-muted transition hover:border-red-300 hover:text-red-600 disabled:opacity-50">
                                <XCircle size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {partnerRequests.length === 0 && <EmptyState text="Заявок нет" />}
                </div>
              </div>
              {/* Pending sidebar */}
              <div className="rounded-2xl border border-line bg-white p-4 shadow-panel self-start">
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={15} className="text-primary" />
                  <h2 className="text-[14px] font-semibold text-ink">На рассмотрении</h2>
                  {pendingRequests.length > 0 && (
                    <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">{pendingRequests.length}</span>
                  )}
                </div>
                {pendingRequests.length === 0 ? (
                  <EmptyState text="Новых заявок нет" />
                ) : (
                  <div className="grid gap-2">
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
                        <p className="text-[13px] font-semibold text-ink">{req.companyName}</p>
                        <p className="text-[11px] text-muted">{req.contactEmail}</p>
                        <div className="mt-2 flex gap-1.5">
                          <button onClick={() => approvePartner(req.id)} disabled={Boolean(pendingAction)} className="flex-1 h-7 rounded-xl bg-primary text-[11px] font-medium text-white disabled:opacity-50">
                            {pendingAction === `partner:${req.id}` ? "..." : "Одобрить"}
                          </button>
                          <button onClick={() => { setReviewModal({ id: req.id, action: "rework" }); setReviewReason(""); }} disabled={Boolean(pendingAction)} className="h-7 w-7 flex items-center justify-center rounded-xl border border-line text-muted hover:border-amber-300 hover:text-amber-600 disabled:opacity-50"><RotateCcw size={11} /></button>
                          <button onClick={() => { setReviewModal({ id: req.id, action: "reject" }); setReviewReason(""); }} disabled={Boolean(pendingAction)} className="h-7 w-7 flex items-center justify-center rounded-xl border border-line text-muted hover:border-red-300 hover:text-red-600 disabled:opacity-50"><XCircle size={11} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── COURSES ── */}
          {tab === "courses" && (
            <div className="rounded-2xl border border-line bg-white p-5 shadow-panel">
              <h2 className="mb-4 text-[15px] font-semibold text-ink">
                Модерация курсов ({allCourses.filter(c => c.status !== "PUBLISHED").length} ожидают)
              </h2>
              <div className="grid gap-2">
                {allCourses.filter((c) => c.status !== "PUBLISHED").map((course) => (
                  <div key={course.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{course.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{courseStatusLabel(course.status)} · {course.courseType === "COMPANY" ? "корпоративный" : "публичный"}</p>
                    </div>
                    <button onClick={() => setCourseStatus(course.id, "PUBLISHED")} disabled={Boolean(pendingAction)} className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-primary px-3 text-[12px] font-medium text-white disabled:opacity-50">
                      <CheckCircle2 size={12} />{pendingAction === `course:${course.id}` ? "..." : "Опубликовать"}
                    </button>
                    <button onClick={() => setCourseStatus(course.id, "HIDDEN")} disabled={Boolean(pendingAction)} className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-line px-3 text-[12px] font-medium text-muted disabled:opacity-50">
                      <EyeOff size={12} />Скрыть
                    </button>
                  </div>
                ))}
                {allCourses.every((c) => c.status === "PUBLISHED") && <EmptyState text="Очередь модерации пуста" />}
                {allCourses.filter((c) => c.status === "PUBLISHED").length > 0 && (
                  <div className="mt-2 border-t border-line pt-3">
                    <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-muted">Опубликованные курсы</p>
                    {allCourses.filter((c) => c.status === "PUBLISHED").map((course) => (
                      <div key={course.id} className="flex items-center gap-3 rounded-xl border border-line p-3 mb-2">
                        <p className="truncate flex-1 text-[13px] font-medium text-ink">{course.title}</p>
                        <button onClick={() => setCourseStatus(course.id, "HIDDEN")} disabled={Boolean(pendingAction)} className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-line px-3 text-[12px] font-medium text-muted disabled:opacity-50">
                          <EyeOff size={12} />Скрыть
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── INTENSIVES ── */}
          {tab === "intensives" && (
            <div className="rounded-2xl border border-line bg-white p-5 shadow-panel">
              <h2 className="mb-4 text-[15px] font-semibold text-ink">Интенсивы ({allIntensives.length})</h2>
              <div className="grid gap-2">
                {allIntensives.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{item.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{intensiveStatusLabel(item.status)} · лимит {item.participantLimit}</p>
                    </div>
                    {item.status === "HIDDEN" ? (
                      <button onClick={() => setIntensiveStatus(item.id, "ENROLLMENT_OPEN")} disabled={Boolean(pendingAction)} className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-primary px-3 text-[12px] font-medium text-white disabled:opacity-50">
                        <CheckCircle2 size={12} />{pendingAction === `intensive:${item.id}` ? "..." : "Открыть"}
                      </button>
                    ) : (
                      <button onClick={() => setIntensiveStatus(item.id, "HIDDEN")} disabled={Boolean(pendingAction)} className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-line px-3 text-[12px] font-medium text-muted disabled:opacity-50">
                        <EyeOff size={12} />{pendingAction === `intensive:${item.id}` ? "..." : "Скрыть"}
                      </button>
                    )}
                  </div>
                ))}
                {allIntensives.length === 0 && <EmptyState text="Интенсивов пока нет" />}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ── Documents modal ── */}
      {docModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                <h3 className="text-[15px] font-semibold text-ink">Документы: {docModal.name}</h3>
              </div>
              <button onClick={() => setDocModal(null)} className="text-muted hover:text-ink"><X size={18} /></button>
            </div>
            <DocLinks org={docModal} />
            <button onClick={() => setDocModal(null)} className="mt-4 w-full h-10 rounded-xl border border-line text-sm text-muted">Закрыть</button>
          </div>
        </div>
      )}

      {/* ── Add user to org modal ── */}
      {addUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserPlus size={16} className="text-primary" />
                <h3 className="text-[15px] font-semibold text-ink">Добавить в «{addUserModal.orgName}»</h3>
              </div>
              <button onClick={() => setAddUserModal(null)} className="text-muted hover:text-ink"><X size={18} /></button>
            </div>
            <p className="mb-3 text-[13px] text-muted">Найдите пользователя по email или имени и назначьте роль в компании.</p>
            <div className="mb-3">
              <label className="mb-1.5 block text-[12px] font-semibold text-muted">Роль в компании</label>
              <select value={addUserRole} onChange={(e) => setAddUserRole(e.target.value)} className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary">
                <option value="CORPORATE_STUDENT">Сотрудник компании</option>
                <option value="PARTNER_MANAGER">Менеджер партнёра</option>
                <option value="MENTOR">Наставник</option>
              </select>
            </div>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Поиск по email или имени..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full rounded-xl border border-line py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="max-h-52 overflow-y-auto grid gap-1.5">
              {searchingUsers && <p className="text-[12px] text-muted text-center py-2">Поиск...</p>}
              {!searchingUsers && userSearch.trim() && userSearchResults.length === 0 && (
                <p className="text-[12px] text-muted text-center py-2">Пользователи не найдены</p>
              )}
              {userSearchResults.map((u) => (
                <div key={u.id} className="flex items-center gap-2 rounded-xl border border-line p-2.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-light text-[12px] font-bold text-primary">
                    {u.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-ink">{u.fullName}</p>
                    <p className="truncate text-[11px] text-muted">{u.email}</p>
                  </div>
                  <button onClick={() => addUserToOrg(u.id)} disabled={Boolean(addingUserId)} className="shrink-0 h-7 rounded-xl bg-primary px-2.5 text-[11px] font-medium text-white disabled:opacity-50">
                    {addingUserId === u.id ? "..." : "Добавить"}
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setAddUserModal(null)} className="mt-4 w-full h-10 rounded-xl border border-line text-sm text-muted">Отмена</button>
          </div>
        </div>
      )}

      {/* ── Review reason modal ── */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-line bg-white p-6 shadow-xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-primary" />
                <h3 className="text-[15px] font-semibold text-ink">
                  {reviewModal.action === "reject" ? "Отклонить заявку" : "Вернуть на доработку"}
                </h3>
              </div>
              <button onClick={() => setReviewModal(null)} className="text-muted hover:text-ink"><X size={18} /></button>
            </div>
            <p className="text-[13px] text-muted mb-3">
              {reviewModal.action === "reject"
                ? "Укажите причину отклонения — она будет видна в профиле компании."
                : "Объясните что нужно доработать — компания увидит это в профиле."}
            </p>
            <textarea className="w-full min-h-24 rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Причина..." value={reviewReason} onChange={(e) => setReviewReason(e.target.value)} />
            <div className="mt-4 flex gap-2">
              <button onClick={() => reviewPartner(reviewModal.id, reviewModal.action, reviewReason)} disabled={Boolean(pendingAction)} className={`flex-1 h-10 rounded-xl text-sm font-semibold text-white disabled:opacity-50 ${reviewModal.action === "reject" ? "bg-red-600" : "bg-amber-500"}`}>
                {reviewModal.action === "reject" ? "Отклонить" : "На доработку"}
              </button>
              <button onClick={() => setReviewModal(null)} className="h-10 px-4 rounded-xl border border-line text-sm text-muted">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
