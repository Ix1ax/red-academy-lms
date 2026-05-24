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
  EyeOff,
  GraduationCap,
  Layers,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trophy,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

type AdminUser = { id: string; email: string; fullName: string; role: string; organizationId?: string | null };
type Organization = { id: string; name: string; type: string; status: string };
type PartnerRequest = {
  id: string;
  companyName: string;
  contactEmail: string;
  status: string;
  description?: string | null;
  reviewReason?: string | null;
};

const ROLE_ORDER = ["ADMIN", "PARTNER_MANAGER", "MENTOR", "STUDENT", "CORPORATE_STUDENT"];

export function AdminPage({ courses, intensives, session }: { courses: Course[]; intensives: Intensive[]; session: Session | null }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [partnerRequests, setPartnerRequests] = useState<PartnerRequest[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>(courses);
  const [allIntensives, setAllIntensives] = useState<Intensive[]>(intensives);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState("");
  const [reviewModal, setReviewModal] = useState<{ id: string; action: "reject" | "rework" } | null>(null);
  const [reviewReason, setReviewReason] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    users: true, orgs: false, requests: true, courses: true, intensives: false, analytics: true,
  });

  const toggle = (key: string) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  async function load() {
    if (loading) return;
    setLoading(true);
    try {
      const coursePath = session?.user.organizationId
        ? `/api/courses?status=ALL&organizationId=${session.user.organizationId}`
        : "/api/courses?status=ALL";
      const [nextUsers, nextOrgs, nextRequests, nextCourses] = await Promise.all([
        apiRequest<AdminUser[]>("/api/users"),
        apiRequest<Organization[]>("/api/organizations"),
        apiRequest<PartnerRequest[]>("/api/organizations/partner-requests"),
        apiRequest<Course[]>(coursePath),
      ]);
      setUsers(nextUsers);
      setOrganizations(nextOrgs);
      setPartnerRequests(nextRequests);
      setAllCourses(nextCourses);
    } catch {
      toastError("Данные временно недоступны", "Попробуйте обновить страницу.");
    } finally {
      setLoading(false);
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

  // Analytics derived
  const roleBreakdown = ROLE_ORDER.map((role) => ({ role, count: users.filter((u) => u.role === role).length })).filter((r) => r.count > 0);
  const coursesByStatus = ["PUBLISHED", "DRAFT", "MODERATION", "HIDDEN"].map((s) => ({ status: s, count: allCourses.filter((c) => c.status === s).length })).filter((s) => s.count > 0);
  const pendingRequests = partnerRequests.filter((r) => r.status === "PENDING");
  const partnerOrgs = organizations.filter((o) => o.type === "PARTNER" || o.type === "PARTNER_MANAGER");
  const companyOrgs = organizations.filter((o) => o.type === "COMPANY" || o.type === "CORPORATE_CLIENT");

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
          { icon: <UsersRound size={20} />, label: "Пользователи", value: users.length, sub: `${users.filter(u => u.role === "STUDENT" || u.role === "CORPORATE_STUDENT").length} студентов` },
          { icon: <Building2 size={20} />, label: "Организации", value: organizations.length, sub: `${companyOrgs.length} компаний` },
          { icon: <BookOpen size={20} />, label: "Курсы", value: allCourses.length, sub: `${allCourses.filter(c => c.status === "PUBLISHED").length} опубликовано` },
          { icon: <Trophy size={20} />, label: "Интенсивы", value: allIntensives.length, sub: `${allIntensives.filter(i => i.status === "ENROLLMENT_OPEN" || i.status === "REGISTRATION_OPEN").length} активных` },
        ].map(({ icon, label, value, sub }) => (
          <article key={label} className="rounded-2xl border border-line bg-white p-5 shadow-panel">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-primary">{icon}</div>
            <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
            <p className="text-[13px] font-medium text-muted">{label}</p>
            <p className="mt-0.5 text-[11px] text-muted">{sub}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left column: accordion sections */}
        <div className="grid content-start gap-3">

          {/* Analytics */}
          <AccordionSection icon={<BarChart3 size={16} />} title="Аналитика и отчётность" sectionKey="analytics" open={openSections.analytics} onToggle={toggle}>
            <div className="grid gap-4 sm:grid-cols-2">
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
            {/* Company breakdown */}
            {companyOrgs.length > 0 && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-muted">Компании-партнёры</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {companyOrgs.map((org) => (
                    <div key={org.id} className="flex items-center gap-2 rounded-xl border border-line bg-surface p-3">
                      <Building2 size={14} className="shrink-0 text-muted" />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-ink">{org.name}</p>
                        <p className="text-[11px] text-muted">{org.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AccordionSection>

          {/* Users */}
          <AccordionSection icon={<UsersRound size={16} />} title={`Пользователи (${users.length})`} sectionKey="users" open={openSections.users} onToggle={toggle}>
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
                  <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-muted">{memberRoleLabel(user.role)}</span>
                </div>
              ))}
              {users.length === 0 && <EmptyState text="Пользователи не загружены" />}
            </div>
          </AccordionSection>

          {/* Organizations */}
          <AccordionSection icon={<Building2 size={16} />} title={`Организации (${organizations.length})`} sectionKey="orgs" open={openSections.orgs} onToggle={toggle}>
            <div className="grid gap-2 sm:grid-cols-2">
              {organizations.map((org) => (
                <div key={org.id} className="rounded-xl border border-line p-3">
                  <p className="text-[13px] font-semibold text-ink">{org.name}</p>
                  <div className="mt-1.5 flex gap-2">
                    <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-muted">{org.type}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${org.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-surface text-muted"}`}>{org.status}</span>
                  </div>
                </div>
              ))}
              {organizations.length === 0 && <EmptyState text="Организации не загружены" />}
            </div>
          </AccordionSection>

          {/* Courses moderation */}
          <AccordionSection icon={<BookOpen size={16} />} title={`Модерация курсов (${allCourses.filter(c => c.status !== "PUBLISHED").length} ожидают)`} sectionKey="courses" open={openSections.courses} onToggle={toggle}>
            <div className="grid gap-2">
              {allCourses.filter((c) => c.status !== "PUBLISHED").slice(0, 8).map((course) => (
                <div key={course.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{course.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted">{courseStatusLabel(course.status)} · {course.courseType === "COMPANY" ? "корпоративный" : "публичный"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setCourseStatus(course.id, "PUBLISHED")} disabled={Boolean(pendingAction)} className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-primary px-3 text-[12px] font-medium text-white disabled:opacity-50">
                      <CheckCircle2 size={12} />{pendingAction === `course:${course.id}` ? "..." : "Опубликовать"}
                    </button>
                    {course.status !== "HIDDEN" && (
                      <button onClick={() => setCourseStatus(course.id, "HIDDEN")} disabled={Boolean(pendingAction)} className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-line px-3 text-[12px] font-medium text-muted disabled:opacity-50">
                        <EyeOff size={12} />Скрыть
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {allCourses.every((c) => c.status === "PUBLISHED") && <EmptyState text="Очередь модерации пуста" />}
              {allCourses.filter((c) => c.status === "PUBLISHED").length > 0 && (
                <div className="border-t border-line pt-2">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-muted mb-2">Опубликованные курсы</p>
                  {allCourses.filter((c) => c.status === "PUBLISHED").map((course) => (
                    <div key={course.id} className="flex items-center gap-3 rounded-xl border border-line p-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">{course.title}</p>
                      </div>
                      <button onClick={() => setCourseStatus(course.id, "HIDDEN")} disabled={Boolean(pendingAction)} className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-line px-3 text-[12px] font-medium text-muted disabled:opacity-50">
                        <EyeOff size={12} />Скрыть
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AccordionSection>

          {/* Intensives moderation */}
          <AccordionSection icon={<Trophy size={16} />} title={`Интенсивы (${allIntensives.length})`} sectionKey="intensives" open={openSections.intensives} onToggle={toggle}>
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
          </AccordionSection>
        </div>

        {/* Right sidebar */}
        <aside className="grid content-start gap-3">
          {/* Pending requests */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-panel">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={15} className="text-primary" />
              <h2 className="text-[14px] font-semibold text-ink">Партнёрские заявки</h2>
              {pendingRequests.length > 0 && (
                <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">{pendingRequests.length}</span>
              )}
            </div>
            <div className="grid gap-2">
              {partnerRequests.map((req) => (
                <div key={req.id} className="rounded-xl border border-line p-3">
                  <p className="text-[13px] font-semibold text-ink">{req.companyName}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{req.contactEmail}</p>
                  {req.description && (
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-muted italic">{req.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      req.status === "PENDING" ? "bg-amber-50 text-amber-700" :
                      req.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" :
                      req.status === "REJECTED" ? "bg-red-50 text-red-700" :
                      "bg-surface text-muted"
                    }`}>
                      {applicationStatusLabel(req.status)}
                    </span>
                    {req.reviewReason && (
                      <span className="text-[10px] text-muted italic">«{req.reviewReason}»</span>
                    )}
                  </div>
                  {req.status === "PENDING" && (
                    <div className="mt-2 flex gap-1.5">
                      <button
                        onClick={() => approvePartner(req.id)}
                        disabled={Boolean(pendingAction)}
                        className="flex-1 h-7 rounded-xl bg-primary text-[11px] font-medium text-white disabled:opacity-50"
                      >
                        {pendingAction === `partner:${req.id}` ? "..." : "Одобрить"}
                      </button>
                      <button
                        onClick={() => { setReviewModal({ id: req.id, action: "rework" }); setReviewReason(""); }}
                        disabled={Boolean(pendingAction)}
                        title="На доработку"
                        className="h-7 w-7 flex items-center justify-center rounded-xl border border-line text-muted transition hover:border-amber-300 hover:text-amber-600 disabled:opacity-50"
                      >
                        <RotateCcw size={11} />
                      </button>
                      <button
                        onClick={() => { setReviewModal({ id: req.id, action: "reject" }); setReviewReason(""); }}
                        disabled={Boolean(pendingAction)}
                        title="Отклонить"
                        className="h-7 w-7 flex items-center justify-center rounded-xl border border-line text-muted transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                      >
                        <XCircle size={11} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {partnerRequests.length === 0 && <EmptyState text="Новых заявок нет" />}
            </div>
          </div>

          {/* Review reason modal */}
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
                  <button onClick={() => setReviewModal(null)} className="text-muted hover:text-ink">
                    <X size={18} />
                  </button>
                </div>
                <p className="text-[13px] text-muted mb-3">
                  {reviewModal.action === "reject"
                    ? "Укажите причину отклонения — она будет видна в профиле компании."
                    : "Объясните что нужно доработать — компания увидит это в профиле."}
                </p>
                <textarea
                  className="w-full min-h-24 rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Причина..."
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                />
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => reviewPartner(reviewModal.id, reviewModal.action, reviewReason)}
                    disabled={Boolean(pendingAction)}
                    className={`flex-1 h-10 rounded-xl text-sm font-semibold text-white disabled:opacity-50 ${
                      reviewModal.action === "reject" ? "bg-red-600" : "bg-amber-500"
                    }`}
                  >
                    {reviewModal.action === "reject" ? "Отклонить" : "На доработку"}
                  </button>
                  <button
                    onClick={() => setReviewModal(null)}
                    className="h-10 px-4 rounded-xl border border-line text-sm text-muted"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Platform summary */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-panel">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap size={15} className="text-primary" />
              <h2 className="text-[14px] font-semibold text-ink">Сводка платформы</h2>
            </div>
            <div className="grid gap-2 text-[13px]">
              {[
                ["Студентов", users.filter(u => u.role === "STUDENT" || u.role === "CORPORATE_STUDENT").length],
                ["Менторов", users.filter(u => u.role === "MENTOR").length],
                ["Партнёров", users.filter(u => u.role === "PARTNER_MANAGER").length],
                ["Компаний", companyOrgs.length],
                ["Партнёров", partnerOrgs.length],
                ["Курсов публичных", allCourses.filter(c => c.courseType === "PUBLIC").length],
                ["Курсов корпоративных", allCourses.filter(c => c.courseType === "COMPANY").length],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex items-center justify-between border-b border-line pb-1.5 last:border-0 last:pb-0">
                  <span className="text-muted">{k}</span>
                  <span className="font-semibold text-ink">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function AccordionSection({ icon, title, sectionKey, open, onToggle, children }: {
  icon: React.ReactNode; title: string; sectionKey: string; open: boolean; onToggle: (key: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-panel">
      <button onClick={() => onToggle(sectionKey)} className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-surface">
        <span className="text-primary">{icon}</span>
        <span className="flex-1 text-[14px] font-semibold text-ink">{title}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-muted" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-line p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-xl bg-surface p-3 text-center text-[13px] text-muted">{text}</p>;
}
