import type { Course } from "@/entities/course/model/types";
import type { Intensive } from "@/entities/intensive/model/types";
import { apiRequest } from "@/shared/api/client";
import type { Role, Session } from "@/shared/auth/session";
import { courseStatusLabel, intensiveStatusLabel, memberRoleLabel } from "@/shared/lib/labels";
import { navigate } from "@/shared/router";
import { ImageUpload } from "@/shared/ui/ImageUpload";
import { StudioField, StudioStep, StudioTextArea } from "@/shared/ui/studio";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import {
  AlertTriangle,
  Bold,
  BookOpenCheck,
  CheckCircle2,
  Code,
  Eye,
  EyeOff,
  FileText,
  FolderPlus,
  Heading2,
  Heading3,
  Info,
  Italic,
  Layers3,
  Link,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Pencil,
  Pilcrow,
  Plus,
  Quote,
  Search,
  Strikethrough,
  Trash2,
  Trophy,
  Underline,
} from "lucide-react";
import type { DragEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type Owner = "COMPANY" | "PARTNER" | "MAIN_COMPANY";
type LessonType = "FOLDER" | "LONGREAD" | "TEST";
type QuestionType = "single_choice" | "multiple_choice" | "text";

type ContentItem = {
  id: string;
  parentId: string | null;
  type: LessonType;
  title: string;
  htmlContent: string | null;
  testSchema: TestSchema | null;
  estimatedMinutes: number;
  position: number;
};

type TestSchema = {
  questions: TestQuestion[];
};

type TestQuestion = {
  type: QuestionType;
  title: string;
  options: string[];
  answer: string[];
};

type CourseContent = {
  courseId: string;
  items: ContentItem[];
};

type Member = {
  id: string;
  organizationId: string;
  userId: string;
  role: Role | "OWNER" | string;
  status: string;
  email?: string | null;
  fullName?: string | null;
};

type IntensiveStageForm = {
  id: string;
  title: string;
  description: string;
  taskTitle: string;
  taskDescription: string;
  /** ISO-8601 local datetime string for stage open date, optional */
  startsAt: string;
  /** ISO-8601 local datetime string for stage close date, optional */
  endsAt: string;
};

export function MyCoursesPage({
  session,
  courses,
  intensives,
  setCourses,
  setIntensives
}: {
  session: Session | null;
  courses: Course[];
  intensives: Intensive[];
  setCourses: (items: Course[]) => void;
  setIntensives: (items: Intensive[]) => void;
}) {
  const [allCourses, setAllCourses] = useState<Course[]>(courses);
  const [pendingLibraryAction, setPendingLibraryAction] = useState("");
  const owner = ownerForSession(session);
  const organizationId = session?.user.organizationId ?? null;

  useEffect(() => {
    const path = organizationId ? `/api/courses?status=ALL&organizationId=${organizationId}` : "/api/courses?status=ALL";
    apiRequest<Course[]>(path).then(setAllCourses).catch(() => toastError("Не удалось загрузить ваши курсы", "Попробуйте обновить страницу."));
  }, [organizationId]);

  const ownedCourses = useMemo(() => allCourses.filter((course) => isOwnedCourse(course, owner, organizationId)), [allCourses, organizationId, owner]);
  const ownedIntensives = useMemo(() => intensives.filter((intensive) => isOwnedIntensive(intensive, owner, organizationId)), [intensives, organizationId, owner]);

  async function changeCourseStatus(course: Course, status: "PUBLISHED" | "HIDDEN") {
    const actionId = `course:${course.id}`;
    if (pendingLibraryAction) return;
    setPendingLibraryAction(actionId);
    try {
      const updated = await apiRequest<Course>(`/api/courses/${course.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      const nextAll = allCourses.map((item) => (item.id === updated.id ? updated : item));
      setAllCourses(nextAll);
      setCourses(courses.map((item) => (item.id === updated.id ? updated : item)));
      toastSuccess(status === "PUBLISHED" ? "Курс опубликован" : "Курс скрыт");
    } catch (error) {
      toastError("Не удалось изменить видимость курса", error instanceof Error ? error.message : undefined);
    } finally {
      setPendingLibraryAction("");
    }
  }

  async function deleteCourse(courseId: string) {
    if (pendingLibraryAction) return;
    if (!window.confirm("Удалить курс вместе с программой и прогрессом?")) return;
    setPendingLibraryAction(`course:${courseId}`);
    try {
      await apiRequest(`/api/courses/${courseId}`, { method: "DELETE" });
      setAllCourses(allCourses.filter((item) => item.id !== courseId));
      setCourses(courses.filter((item) => item.id !== courseId));
      toastSuccess("Курс удален");
    } catch (error) {
      toastError("Не удалось удалить курс", error instanceof Error ? error.message : undefined);
    } finally {
      setPendingLibraryAction("");
    }
  }

  async function deleteIntensive(intensiveId: string) {
    if (pendingLibraryAction) return;
    if (!window.confirm("Удалить интенсив вместе с этапами и заявками?")) return;
    setPendingLibraryAction(`intensive:${intensiveId}`);
    try {
      await apiRequest(`/api/intensives/${intensiveId}`, { method: "DELETE" });
      setIntensives(intensives.filter((item) => item.id !== intensiveId));
      toastSuccess("Интенсив удален");
    } catch (error) {
      toastError("Не удалось удалить интенсив", error instanceof Error ? error.message : undefined);
    } finally {
      setPendingLibraryAction("");
    }
  }

  async function changeIntensiveStatus(intensive: Intensive, status: "ENROLLMENT_OPEN" | "HIDDEN") {
    const actionId = `intensive:${intensive.id}`;
    if (pendingLibraryAction) return;
    setPendingLibraryAction(actionId);
    try {
      const updated = await apiRequest<Intensive>(`/api/intensives/${intensive.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      setIntensives(intensives.map((item) => (item.id === updated.id ? updated : item)));
      toastSuccess(status === "HIDDEN" ? "Интенсив скрыт" : "Интенсив открыт");
    } catch (error) {
      toastError("Не удалось изменить видимость интенсива", error instanceof Error ? error.message : undefined);
    } finally {
      setPendingLibraryAction("");
    }
  }

  return (
    <div className="grid gap-5">
      <PageHeader icon={<Layers3 size={24} />} title="Мои курсы" text="Здесь создаются и редактируются курсы, уроки, тесты и интенсивы." />
      <section className="grid gap-3 md:grid-cols-2">
        <ActionCard icon={<BookOpenCheck size={20} />} title="Создать курс" text="Модули, несколько материалов, тесты и удобный выбор правильных ответов." onClick={() => navigate("/my-courses/courses/new")} />
        <ActionCard icon={<Trophy size={20} />} title="Создать интенсив" text="Дата старта, лимит, три этапа и менеджеры из списка сотрудников." onClick={() => navigate("/my-courses/intensives/new")} />
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="min-w-0 rounded-2xl border border-line bg-white p-4 shadow-panel sm:p-5">
          <h2 className="text-lg font-semibold text-ink">Курсы</h2>
          <div className="mt-4 grid gap-3">
            {ownedCourses.map((course) => (
              <div key={course.id} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{course.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{course.description}</p>
                    <p className="mt-2 text-xs font-medium text-muted">{course.courseType === "COMPANY" ? "Курс компании" : "Публичный курс"} · {courseStatusLabel(course.status)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <IconButton label="Открыть" icon={<Eye size={16} />} onClick={() => navigate(`/courses/${course.id}`)} />
                    <IconButton label="Редактировать" icon={<Pencil size={16} />} onClick={() => navigate(`/my-courses/courses/${course.id}/edit`)} />
                    <IconButton label={course.status === "PUBLISHED" ? "Скрыть" : "Показать"} icon={course.status === "PUBLISHED" ? <EyeOff size={16} /> : <Eye size={16} />} disabled={Boolean(pendingLibraryAction)} onClick={() => changeCourseStatus(course, course.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED")} />
                    <IconButton label="Удалить" icon={<Trash2 size={16} />} danger disabled={Boolean(pendingLibraryAction)} onClick={() => deleteCourse(course.id)} />
                  </div>
                </div>
              </div>
            ))}
            {ownedCourses.length === 0 && <Empty text="Курсов пока нет. Создайте первый курс в студии." />}
          </div>
        </div>

        <aside className="min-w-0 rounded-2xl border border-line bg-white p-5 shadow-panel">
          <h2 className="text-lg font-semibold text-ink">Интенсивы</h2>
          <div className="mt-4 grid gap-3">
            {ownedIntensives.map((intensive) => (
              <div key={intensive.id} className="rounded-2xl border border-line p-4">
                <p className="font-semibold text-ink">{intensive.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{formatDateTime(intensive.startsAt)} · лимит {intensive.participantLimit} · {intensiveStatusLabel(intensive.status)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <IconButton label="Открыть" icon={<Eye size={16} />} onClick={() => navigate(`/intensives/${intensive.id}`)} />
                  <IconButton label="Редактировать" icon={<Pencil size={16} />} onClick={() => navigate(`/my-courses/intensives/${intensive.id}/edit`)} />
                  <IconButton label={intensive.status === "HIDDEN" ? "Показать" : "Скрыть"} icon={intensive.status === "HIDDEN" ? <Eye size={16} /> : <EyeOff size={16} />} disabled={Boolean(pendingLibraryAction)} onClick={() => changeIntensiveStatus(intensive, intensive.status === "HIDDEN" ? "ENROLLMENT_OPEN" : "HIDDEN")} />
                  <IconButton label="Удалить" icon={<Trash2 size={16} />} danger disabled={Boolean(pendingLibraryAction)} onClick={() => deleteIntensive(intensive.id)} />
                </div>
              </div>
            ))}
            {ownedIntensives.length === 0 && <Empty text="Интенсивы появятся после создания." />}
          </div>
        </aside>
      </section>
    </div>
  );
}

export function CourseEditorPage({
  owner,
  session,
  courseId,
  courses,
  setCourses
}: {
  owner: Owner;
  session: Session | null;
  courseId?: string | null;
  courses: Course[];
  setCourses: (items: Course[]) => void;
}) {
  const isEdit = Boolean(courseId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseType, setCourseType] = useState<"PUBLIC" | "COMPANY">(owner === "COMPANY" ? "COMPANY" : "PUBLIC");
  const [level, setLevel] = useState("BEGINNER");
  const [durationHours, setDurationHours] = useState("10");
  const [coverUrl, setCourseCoverUrl] = useState<string | null>(null);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [items, setItems] = useState<ContentItem[]>(() => starterItems());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    apiRequest<{ course: Course; lessons: ContentItem[] }>(`/api/courses/${courseId}`)
      .then((details) => {
        setTitle(details.course.title);
        setDescription(details.course.description);
        setCourseType(details.course.courseType);
        setLevel(details.course.level);
        setDurationHours(String(details.course.durationHours));
        if (details.course.coverUrl) setCourseCoverUrl(details.course.coverUrl);
        setHasCertificate(details.course.hasCertificate ?? false);
      })
      .catch((error) => toastError("Не удалось загрузить курс", error instanceof Error ? error.message : undefined));

    apiRequest<CourseContent>(`/api/courses/${courseId}/content`)
      .then((content) => setItems(normalizeItems(content.items)))
      .catch(() => toastError("Структуру курса загрузить не удалось"));
  }, [courseId]);

  async function save() {
    setSaving(true);
    try {
      if (!title.trim() || !description.trim()) {
        toastError("Заполните название и описание курса");
        return;
      }
      const payload = {
        title,
        description,
        authorType: owner,
        courseType: owner === "MAIN_COMPANY" ? "PUBLIC" : courseType,
        organizationId: owner === "MAIN_COMPANY" ? null : session?.user.organizationId ?? null,
        level,
        durationHours: Number(durationHours) || 1,
        coverUrl: coverUrl ?? null,
        hasCertificate,
      };
      const course = isEdit
        ? await apiRequest<Course>(`/api/courses/${courseId}`, { method: "PUT", body: JSON.stringify(payload) })
        : await apiRequest<Course>("/api/courses", { method: "POST", body: JSON.stringify(payload) });

      await apiRequest(`/api/courses/${course.id}/content`, {
        method: "PUT",
        body: JSON.stringify({ items: prepareItemsForSave(items) })
      });

      setCourses(isEdit ? courses.map((item) => (item.id === course.id ? course : item)) : [course, ...courses]);
      toastSuccess(isEdit ? "Курс сохранен" : "Курс создан", isEdit ? "Карточка и программа обновлены." : "Открываю страницу курса.");
      navigate(`/courses/${course.id}`);
    } catch (error) {
      toastError("Не удалось сохранить курс", error instanceof Error ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5">
      <PageHeader icon={<BookOpenCheck size={24} />} title={isEdit ? "Редактирование курса" : "Создание курса"} text="Соберите программу из модулей, материалов и тестов. Текст оформляется кнопками, без ручной разметки." />
      <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-panel sm:p-5">
        <div className="grid min-w-0 gap-5">
          <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(160px,180px)_minmax(120px,160px)]">
            <StudioField label="Название курса" value={title} onChange={setTitle} />
            <SelectField label="Уровень" value={level} onChange={setLevel} options={["BEGINNER", "INTERMEDIATE", "ADVANCED"]} labels={{ BEGINNER: "Начальный", INTERMEDIATE: "Средний", ADVANCED: "Продвинутый" }} />
            <StudioField label="Часы" value={durationHours} onChange={setDurationHours} />
          </div>
          <StudioTextArea label="Описание курса" value={description} onChange={setDescription} />
          <ImageUpload value={coverUrl ?? undefined} onChange={(url) => setCourseCoverUrl(url)} label="Обложка курса" />
          {owner !== "MAIN_COMPANY" && (
            <SelectField label="Тип доступа" value={courseType} onChange={(value) => setCourseType(value as "PUBLIC" | "COMPANY")} options={owner === "PARTNER" ? ["PUBLIC"] : ["COMPANY", "PUBLIC"]} labels={{ PUBLIC: "Публичный курс", COMPANY: "Курс компании" }} />
          )}

          {/* Certificate toggle */}
          <button
            type="button"
            onClick={() => setHasCertificate((v) => !v)}
            className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all ${hasCertificate ? "border-amber-300 bg-amber-50" : "border-line bg-surface hover:border-amber-200 hover:bg-amber-50/40"}`}
          >
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl transition-all ${hasCertificate ? "bg-amber-100" : "bg-surface"}`}>
              🏅
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-[14px] font-semibold ${hasCertificate ? "text-amber-800" : "text-ink"}`}>Выдавать сертификат при завершении</p>
              <p className="mt-0.5 text-[12px] text-muted">
                {hasCertificate ? "Студент получит красивый PDF-сертификат после прохождения всех уроков" : "Включите, чтобы студенты могли получить сертификат об окончании"}
              </p>
            </div>
            <div className={`h-5 w-9 shrink-0 rounded-full transition-all ${hasCertificate ? "bg-amber-400" : "bg-line"}`}>
              <div className={`mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${hasCertificate ? "translate-x-[18px]" : "translate-x-0.5"}`} />
            </div>
          </button>

          <CourseStructureEditor items={items} setItems={setItems} />

          <div className="flex flex-wrap gap-3">
            <button disabled={saving} onClick={save} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white disabled:opacity-60">
              <CheckCircle2 size={16} />
              {saving ? "Сохраняю..." : "Сохранить курс"}
            </button>
            <button onClick={() => navigate("/my-courses")} className="h-11 rounded-xl border border-line px-4 text-sm font-medium text-ink">
              Вернуться
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function IntensiveEditorPage({
  owner,
  session,
  intensiveId,
  intensives,
  setIntensives
}: {
  owner: Owner;
  session: Session | null;
  intensiveId?: string | null;
  intensives: Intensive[];
  setIntensives: (items: Intensive[]) => void;
}) {
  const isEdit = Boolean(intensiveId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState(() => toLocalDateTimeInput(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()));
  const [endsAt, setEndsAt] = useState(() => toLocalDateTimeInput(new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()));
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [participantLimit, setParticipantLimit] = useState("20");
  const [stages, setStages] = useState<IntensiveStageForm[]>(() => starterStages());
  const [activeStageId, setActiveStageId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [memberQuery, setMemberQuery] = useState("");
  const [managerUserIds, setManagerUserIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session?.user.organizationId) return;
    apiRequest<Member[]>(`/api/organizations/${session.user.organizationId}/members`)
      .then(setMembers)
      .catch(() => toastError("Не удалось загрузить сотрудников для выбора менеджеров"));
  }, [session?.user.organizationId]);

  useEffect(() => {
    if (!stages.length) return;
    if (!activeStageId || !stages.some((stage) => stage.id === activeStageId)) {
      setActiveStageId(stages[0].id);
    }
  }, [activeStageId, stages]);

  useEffect(() => {
    if (!intensiveId) return;
    apiRequest<IntensiveDetails>(`/api/intensives/${intensiveId}`).then((details) => {
      setTitle(details.intensive.title);
      setDescription(details.intensive.description);
      setStartsAt(toLocalDateTimeInput(details.intensive.startsAt));
      setEndsAt(toLocalDateTimeInput(details.intensive.endsAt));
      if (details.intensive.registrationDeadline) {
        setRegistrationDeadline(toLocalDateTimeInput(details.intensive.registrationDeadline));
      }
      if (details.intensive.coverUrl) setCoverUrl(details.intensive.coverUrl);
      setParticipantLimit(String(details.intensive.participantLimit));
      const nextStages = fixedThreeStages(details.stages.map((stage) => ({
        id: stage.id,
        title: stage.title,
        description: stage.description,
        taskTitle: stage.taskTitle,
        taskDescription: stage.taskDescription,
        startsAt: stage.startsAt ? toLocalDateTimeInput(stage.startsAt) : "",
        endsAt: stage.endsAt ? toLocalDateTimeInput(stage.endsAt) : ""
      })));
      setStages(nextStages);
      setActiveStageId(nextStages[0]?.id ?? "");
    }).catch((error) => toastError("Не удалось загрузить интенсив", error instanceof Error ? error.message : undefined));

    apiRequest<Array<{ userId: string }>>(`/api/intensives/${intensiveId}/managers`)
      .then((items) => setManagerUserIds(items.map((item) => item.userId)))
      .catch(() => undefined);
  }, [intensiveId]);

  const filteredMembers = useMemo(() => {
    const query = memberQuery.toLowerCase();
    return members
      .filter((member) => member.status === "ACTIVE")
      .filter((member) => `${member.fullName ?? ""} ${member.email ?? ""} ${member.role}`.toLowerCase().includes(query));
  }, [memberQuery, members]);
  const activeStage = stages.find((stage) => stage.id === activeStageId) ?? stages[0];

  async function save() {
    if (saving) return;
    try {
      if (!title.trim() || !description.trim()) {
        toastError("Заполните название и описание интенсива");
        return;
      }
      if (stages.length !== 3) {
        toastError("Интенсив всегда состоит ровно из трех этапов");
        return;
      }
      setSaving(true);
      const payload = {
        title,
        description,
        organizerType: owner,
        organizationId: owner === "MAIN_COMPANY" ? session?.user.organizationId ?? null : session?.user.organizationId ?? null,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : null,
        coverUrl: coverUrl ?? null,
        participantLimit: Number(participantLimit) || 1,
        creatorUserId: session?.user.id ?? null,
        managerUserIds,
        stages: fixedThreeStages(stages).map((stage) => ({
          title: stage.title,
          description: stage.description,
          taskTitle: stage.taskTitle,
          taskDescription: stage.taskDescription,
          startsAt: stage.startsAt ? new Date(stage.startsAt).toISOString() : null,
          endsAt: stage.endsAt ? new Date(stage.endsAt).toISOString() : null
        }))
      };
      const saved = isEdit
        ? await apiRequest<Intensive>(`/api/intensives/${intensiveId}`, { method: "PUT", body: JSON.stringify(payload) })
        : await apiRequest<Intensive>("/api/intensives", { method: "POST", body: JSON.stringify(payload) });
      setIntensives(isEdit ? intensives.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...intensives]);
      toastSuccess(isEdit ? "Интенсив обновлен" : "Интенсив создан", "Открываю страницу интенсива.");
      navigate(`/intensives/${saved.id}`);
    } catch (error) {
      toastError("Не удалось сохранить интенсив", error instanceof Error ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5">
      <PageHeader icon={<Trophy size={24} />} title={isEdit ? "Редактирование интенсива" : "Создание интенсива"} text="Дата старта задается вручную, программа всегда состоит из трех этапов, менеджеры выбираются из сотрудников организации." />
      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 gap-5 rounded-2xl border border-line bg-white p-4 shadow-panel sm:p-5">
          <StudioField label="Название интенсива" value={title} onChange={setTitle} />
          <StudioTextArea label="Описание интенсива" value={description} onChange={setDescription} />
          <ImageUpload value={coverUrl ?? undefined} onChange={(url) => setCoverUrl(url)} label="Обложка интенсива" />
          <div className="grid min-w-0 gap-3 lg:grid-cols-3">
            <DateTimeField label="Старт интенсива" value={startsAt} onChange={setStartsAt} />
            <DateTimeField label="Финиш интенсива" value={endsAt} onChange={setEndsAt} />
            <StudioField label="Лимит участников" value={participantLimit} onChange={setParticipantLimit} />
          </div>
          <div className="grid min-w-0 gap-3 lg:grid-cols-2">
            <DateTimeField label="Дедлайн регистрации (необязательно)" value={registrationDeadline} onChange={setRegistrationDeadline} />
            <p className="self-end pb-2 text-xs text-muted">Если не указан — регистрация закрывается в момент старта интенсива.</p>
          </div>

          <StudioStep number="1" title="Этапы интенсива" text="Интенсив всегда идёт в три этапа: вводный, основной и финальный. Укажите даты открытия/закрытия каждого этапа или оставьте пустыми — тогда даты распределятся автоматически.">
            <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
              <aside className="grid content-start gap-2 rounded-2xl border border-line bg-white p-2">
                {stages.map((stage, index) => (
                  <button key={stage.id} onClick={() => setActiveStageId(stage.id)} className={`rounded-xl px-3 py-3 text-left text-sm transition ${activeStage?.id === stage.id ? "bg-primary text-white" : "text-muted hover:bg-red-50 hover:text-primary"}`}>
                    <span className="block text-xs font-medium opacity-80">Этап {index + 1}</span>
                    <span className="mt-1 block truncate font-semibold">{stage.title}</span>
                  </button>
                ))}
              </aside>
              {activeStage && (
                <div className="grid min-w-0 gap-3 rounded-2xl border border-line bg-white p-4">
                  <StudioField label="Название этапа" value={activeStage.title} onChange={(value) => updateStage(stages, setStages, activeStage.id, { title: value })} />
                  <StudioTextArea label="Описание этапа" value={activeStage.description} onChange={(value) => updateStage(stages, setStages, activeStage.id, { description: value })} />
                  <StudioField label="Название задания" value={activeStage.taskTitle} onChange={(value) => updateStage(stages, setStages, activeStage.id, { taskTitle: value })} />
                  <StudioTextArea label="Текст задания" value={activeStage.taskDescription} onChange={(value) => updateStage(stages, setStages, activeStage.id, { taskDescription: value })} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DateTimeField label="Этап открывается" value={activeStage.startsAt} onChange={(value) => updateStage(stages, setStages, activeStage.id, { startsAt: value })} />
                    <DateTimeField label="Этап закрывается" value={activeStage.endsAt} onChange={(value) => updateStage(stages, setStages, activeStage.id, { endsAt: value })} />
                  </div>
                  <p className="text-xs text-muted">Оставьте даты пустыми — этап откроется автоматически по расписанию интенсива.</p>
                </div>
              )}
            </div>
          </StudioStep>

          <StudioStep number="2" title="Менеджеры интенсива" text="Выберите людей из организации, которая создает интенсив.">
            <div className="grid gap-3">
              <label className="flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-3">
                <Search className="text-muted" size={16} />
                <input className="min-w-0 flex-1 outline-none" placeholder="Поиск по имени, email или роли" value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} />
              </label>
              <div className="grid max-h-64 gap-2 overflow-auto">
                {filteredMembers.map((member) => {
                  const selected = managerUserIds.includes(member.userId);
                  return (
                    <button key={member.userId} onClick={() => setManagerUserIds(toggleList(managerUserIds, member.userId))} className={`rounded-xl border p-3 text-left text-sm ${selected ? "border-red-200 bg-red-50 text-primary" : "border-line bg-white text-muted"}`}>
                      <span className="font-semibold text-ink">{member.fullName || member.email || "Пользователь"}</span>
                      <span className="ml-2 text-xs">{member.email}</span>
                      <span className="mt-1 block text-xs">{memberRoleLabel(member.role)}</span>
                    </button>
                  );
                })}
                {filteredMembers.length === 0 && <Empty text="Сотрудники не найдены. Добавьте их в кабинете компании или измените поиск." />}
              </div>
            </div>
          </StudioStep>

          <div className="flex flex-wrap gap-3">
            <button onClick={save} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-muted">
              <CheckCircle2 size={16} />
              {saving ? "Сохраняю..." : "Сохранить интенсив"}
            </button>
            <button onClick={() => navigate("/my-courses")} className="h-11 rounded-xl border border-line px-4 text-sm font-medium text-ink">
              Вернуться
            </button>
          </div>
        </div>
        <aside className="min-w-0 rounded-2xl border border-line bg-surface p-4">
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-primary">{stages.length} этапов</span>
          <h3 className="mt-4 text-xl font-semibold leading-tight text-ink">{title || "Новый интенсив"}</h3>
          <p className="mt-3 text-sm leading-6 text-muted">{description || "Описание будущего интенсива появится здесь."}</p>
          <p className="mt-4 rounded-xl bg-white px-3 py-2 text-xs text-muted">Старт: {startsAt ? startsAt.replace("T", " ") : "не указан"}</p>
        </aside>
      </section>
    </div>
  );
}

function CourseStructureEditor({ items, setItems }: { items: ContentItem[]; setItems: (items: ContentItem[]) => void }) {
  const [activeItemId, setActiveItemId] = useState("");
  const [draggedItemId, setDraggedItemId] = useState("");
  const folders = items.filter((item) => item.type === "FOLDER");
  const lessons = items.filter((item) => item.type !== "FOLDER");
  const activeItem = items.find((item) => item.id === activeItemId) ?? lessons[0] ?? folders[0];

  useEffect(() => {
    if (!items.length) {
      setActiveItemId("");
      return;
    }
    if (!activeItemId || !items.some((item) => item.id === activeItemId)) {
      setActiveItemId((lessons[0] ?? folders[0])?.id ?? "");
    }
  }, [activeItemId, folders, items, lessons]);

  function addItem(type: LessonType, parentId: string | null = folders[0]?.id ?? null) {
    const next = type === "FOLDER" ? blankFolder(folders.length + 1) : type === "LONGREAD" ? blankLongread(parentId, lessons.length + 1) : blankTest(parentId, lessons.length + 1);
    setItems([...items, next]);
    setActiveItemId(next.id);
  }

  function updateItem(id: string, patch: Partial<ContentItem>) {
    setItems(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setItems(items.filter((item) => item.id !== id && item.parentId !== id));
    if (activeItemId === id || items.some((item) => item.parentId === id && item.id === activeItemId)) {
      const next = items.find((item) => item.id !== id && item.parentId !== id);
      setActiveItemId(next?.id ?? "");
    }
  }

  function moveItem(dragId: string, targetParentId: string | null, beforeId?: string) {
    const dragged = items.find((item) => item.id === dragId);
    if (!dragged || dragged.type === "FOLDER") return;
    const withoutDragged = items.filter((item) => item.id !== dragId);
    const moved = { ...dragged, parentId: targetParentId };
    const beforeIndex = beforeId ? withoutDragged.findIndex((item) => item.id === beforeId) : -1;
    const next = beforeIndex >= 0
      ? [...withoutDragged.slice(0, beforeIndex), moved, ...withoutDragged.slice(beforeIndex)]
      : [...withoutDragged, moved];
    setItems(next.map((item, index) => ({ ...item, position: index + 1 })));
    setActiveItemId(dragId);
    setDraggedItemId("");
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  return (
    <StudioStep number="3" title="Программа курса" text="Слева структура модулей и уроков, справа редактируется выбранный материал или тест. Так курс собирается как рабочая программа, а не бесконечная лента.">
      <div className="grid min-w-0 gap-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => addItem("FOLDER", null)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-medium text-ink"><FolderPlus size={15} /> Новый модуль</button>
        </div>
        <div className="grid min-w-0 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="grid content-start gap-3 overflow-auto rounded-2xl border border-line bg-white p-3 xl:max-h-[74vh]">
            {folders.map((folder) => (
              <div key={folder.id} className={`rounded-2xl border bg-surface p-2 ${draggedItemId ? "border-red-200" : "border-line"}`} onDragOver={onDragOver} onDrop={() => moveItem(draggedItemId, folder.id)}>
                <button onClick={() => setActiveItemId(folder.id)} className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold ${activeItem?.id === folder.id ? "bg-primary text-white" : "text-ink hover:bg-white"}`}>
                  <span className="min-w-0 truncate">{folder.title}</span>
                  <span className="text-xs opacity-80">{lessons.filter((lesson) => lesson.parentId === folder.id).length}</span>
                </button>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <button onClick={() => addItem("LONGREAD", folder.id)} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-white px-2 text-xs font-medium text-ink hover:text-primary"><FileText size={14} /> Урок</button>
                  <button onClick={() => addItem("TEST", folder.id)} className="inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-white px-2 text-xs font-medium text-ink hover:text-primary"><ListChecks size={14} /> Тест</button>
                </div>
                <div className="mt-2 grid gap-1">
                  {lessons.filter((lesson) => lesson.parentId === folder.id).map((lesson, index) => (
                    <button
                      key={lesson.id}
                      draggable
                      onDragStart={() => setDraggedItemId(lesson.id)}
                      onDragEnd={() => setDraggedItemId("")}
                      onDragOver={onDragOver}
                      onDrop={(event) => {
                        event.stopPropagation();
                        moveItem(draggedItemId, folder.id, lesson.id);
                      }}
                      onClick={() => setActiveItemId(lesson.id)}
                      className={`flex min-w-0 cursor-grab items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm active:cursor-grabbing ${activeItem?.id === lesson.id ? "bg-red-50 text-primary" : "text-muted hover:bg-white hover:text-ink"}`}
                    >
                      <span className="min-w-0 truncate">{index + 1}. {lesson.title}</span>
                      <span className="shrink-0 text-xs">{lesson.type === "TEST" ? "тест" : "урок"}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {lessons.filter((lesson) => !lesson.parentId).length > 0 && (
              <div className="rounded-2xl border border-line bg-surface p-2" onDragOver={onDragOver} onDrop={() => moveItem(draggedItemId, null)}>
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">Без папки</p>
                {lessons.filter((lesson) => !lesson.parentId).map((lesson, index) => (
                  <button
                    key={lesson.id}
                    draggable
                    onDragStart={() => setDraggedItemId(lesson.id)}
                    onDragEnd={() => setDraggedItemId("")}
                    onDragOver={onDragOver}
                    onDrop={(event) => {
                      event.stopPropagation();
                      moveItem(draggedItemId, null, lesson.id);
                    }}
                    onClick={() => setActiveItemId(lesson.id)}
                    className={`flex w-full min-w-0 cursor-grab items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm active:cursor-grabbing ${activeItem?.id === lesson.id ? "bg-red-50 text-primary" : "text-muted hover:bg-white hover:text-ink"}`}
                  >
                    <span className="min-w-0 truncate">{index + 1}. {lesson.title}</span>
                    <span className="shrink-0 text-xs">{lesson.type === "TEST" ? "тест" : "урок"}</span>
                  </button>
                ))}
              </div>
            )}
          </aside>
          <div className="min-w-0">
            {activeItem?.type === "FOLDER" ? (
              <div className="grid min-w-0 gap-3 rounded-2xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-primary">Папка</span>
                  <IconButton label="Удалить папку" icon={<Trash2 size={15} />} danger onClick={() => removeItem(activeItem.id)} />
                </div>
                <StudioField label="Название папки" value={activeItem.title} onChange={(value) => updateItem(activeItem.id, { title: value })} />
                <p className="rounded-2xl bg-surface p-4 text-sm leading-6 text-muted">Добавляйте уроки и тесты кнопками внутри модуля в боковой панели. Центральная область открывает настройки выбранного блока, а порядок меняется перетаскиванием слева.</p>
              </div>
            ) : activeItem ? (
              <LessonEditor lesson={activeItem} updateItem={updateItem} removeItem={removeItem} />
            ) : (
              <Empty text="Добавьте модуль, лонгрид или тест." />
            )}
          </div>
        </div>
      </div>
    </StudioStep>
  );
}

function LessonEditor({ lesson, updateItem, removeItem }: { lesson: ContentItem; updateItem: (id: string, patch: Partial<ContentItem>) => void; removeItem: (id: string) => void }) {
  return (
    <div className="grid min-w-0 gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-primary">{lesson.type === "TEST" ? "Тест" : "Лонгрид"}</span>
        <IconButton label="Удалить" icon={<Trash2 size={15} />} danger onClick={() => removeItem(lesson.id)} />
      </div>
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(96px,120px)]">
        <StudioField label="Название" value={lesson.title} onChange={(value) => updateItem(lesson.id, { title: value })} />
        <StudioField label="Минуты" value={String(lesson.estimatedMinutes)} onChange={(value) => updateItem(lesson.id, { estimatedMinutes: Number(value) || 1 })} />
      </div>
      {lesson.type === "LONGREAD" ? (
        <RichTextEditor value={lesson.htmlContent ?? ""} onChange={(value) => updateItem(lesson.id, { htmlContent: value })} />
      ) : (
        <TestEditor schema={lesson.testSchema ?? { questions: [] }} onChange={(testSchema) => updateItem(lesson.id, { testSchema })} />
      )}
    </div>
  );
}

function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  function run(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML ?? "");
  }

  function insertHtml(html: string) {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    onChange(editorRef.current?.innerHTML ?? "");
  }

  function insertLink() {
    const url = window.prompt("Введите URL ссылки:", "https://");
    if (url) run("createLink", url);
  }

  function insertCallout(type: "info" | "warning" | "tip") {
    const icons = { info: "ℹ️", warning: "⚠️", tip: "💡" };
    const labels = { info: "Важно", warning: "Внимание", tip: "Совет" };
    const colors = { info: "#dbeafe", warning: "#fef3c7", tip: "#d1fae5" };
    const borderColors = { info: "#93c5fd", warning: "#fcd34d", tip: "#6ee7b7" };
    insertHtml(
      `<div style="background:${colors[type]};border-left:4px solid ${borderColors[type]};border-radius:12px;padding:12px 16px;margin:12px 0">` +
      `<strong>${icons[type]} ${labels[type]}:</strong><br><span>Введите текст здесь...</span></div><p></p>`
    );
  }

  function insertCodeBlock() {
    insertHtml(`<pre style="background:#0f1219;color:#e2e8f0;border-radius:12px;padding:16px;overflow-x:auto;font-size:14px;line-height:1.6;margin:12px 0"><code># Вставьте код здесь</code></pre><p></p>`);
  }

  function insertDivider() {
    insertHtml(`<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" /><p></p>`);
  }

  return (
    <div className="grid min-w-0 gap-2">
      {/* Toolbar */}
      <div className="flex max-w-full flex-wrap gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-1.5 sm:gap-1.5 sm:p-2">
        {/* Heading group */}
        <div className="flex items-center gap-1">
          <IconToolbarBtn icon={<Heading2 size={14} />} label="Заголовок H2" onClick={() => run("formatBlock", "<h2>")} />
          <IconToolbarBtn icon={<Heading3 size={14} />} label="Заголовок H3" onClick={() => run("formatBlock", "<h3>")} />
          <IconToolbarBtn icon={<Pilcrow size={14} />} label="Параграф" onClick={() => run("formatBlock", "<p>")} />
        </div>
        <div className="w-px self-stretch bg-line" />
        {/* Text formatting */}
        <div className="flex items-center gap-1">
          <IconToolbarBtn icon={<Bold size={14} />} label="Жирный (Ctrl+B)" onClick={() => run("bold")} />
          <IconToolbarBtn icon={<Italic size={14} />} label="Курсив (Ctrl+I)" onClick={() => run("italic")} />
          <IconToolbarBtn icon={<Underline size={14} />} label="Подчёркнутый" onClick={() => run("underline")} />
          <IconToolbarBtn icon={<Strikethrough size={14} />} label="Зачёркнутый" onClick={() => run("strikethrough")} />
        </div>
        <div className="w-px self-stretch bg-line" />
        {/* Lists */}
        <div className="flex items-center gap-1">
          <IconToolbarBtn icon={<List size={14} />} label="Список" onClick={() => run("insertUnorderedList")} />
          <IconToolbarBtn icon={<ListOrdered size={14} />} label="Нумерация" onClick={() => run("insertOrderedList")} />
          <IconToolbarBtn icon={<ListChecks size={14} />} label="Чеклист" onClick={() => insertHtml('<ul><li>☐ Пункт 1</li><li>☐ Пункт 2</li></ul>')} />
        </div>
        <div className="w-px self-stretch bg-line" />
        {/* Inserts */}
        <div className="flex items-center gap-1">
          <IconToolbarBtn icon={<Quote size={14} />} label="Цитата" onClick={() => run("formatBlock", "<blockquote>")} />
          <IconToolbarBtn icon={<Code size={14} />} label="Блок кода" onClick={insertCodeBlock} />
          <IconToolbarBtn icon={<Minus size={14} />} label="Разделитель" onClick={insertDivider} />
          <IconToolbarBtn icon={<Link size={14} />} label="Ссылка" onClick={insertLink} />
        </div>
        <div className="w-px self-stretch bg-line" />
        {/* Callouts */}
        <div className="flex items-center gap-1">
          <IconToolbarBtn icon={<Info size={14} className="text-blue-500" />} label="Заметка" onClick={() => insertCallout("info")} />
          <IconToolbarBtn icon={<AlertTriangle size={14} className="text-amber-500" />} label="Внимание" onClick={() => insertCallout("warning")} />
          <IconToolbarBtn icon={<FileText size={14} className="text-emerald-500" />} label="Совет" onClick={() => insertCallout("tip")} />
        </div>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        className="prose min-h-72 max-w-none overflow-auto rounded-2xl border border-line bg-white px-5 py-4 text-ink outline-none focus:border-primary"
        contentEditable
        suppressContentEditableWarning
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
      />

      <p className="text-[11px] text-muted">
        Поддерживается HTML разметка. Callouts, код, списки, заголовки — всё отображается в курсе.
      </p>
    </div>
  );
}

function IconToolbarBtn({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={label}
      className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-primary-light hover:text-primary"
    >
      {icon}
    </button>
  );
}

function ToolbarButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={onClick} title={label} className="inline-flex h-9 min-w-0 items-center gap-2 rounded-xl border border-line px-3 text-sm font-medium text-ink hover:border-red-200 hover:text-primary">
      {icon}
      <span>{label}</span>
    </button>
  );
}

function TestEditor({ schema, onChange }: { schema: TestSchema; onChange: (schema: TestSchema) => void }) {
  const questions = schema.questions ?? [];

  function updateQuestion(index: number, patch: Partial<TestQuestion>) {
    onChange({ questions: questions.map((question, current) => (current === index ? { ...question, ...patch } : question)) });
  }

  return (
    <div className="grid min-w-0 gap-3">
      {questions.map((question, index) => (
        <div key={index} className="grid min-w-0 gap-3 overflow-hidden rounded-2xl border border-line bg-white p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">Вопрос {index + 1}</p>
            <IconButton label="Удалить вопрос" icon={<Trash2 size={15} />} danger onClick={() => onChange({ questions: questions.filter((_, current) => current !== index) })} />
          </div>
          <StudioField label="Текст вопроса" value={question.title} onChange={(value) => updateQuestion(index, { title: value })} />
          <SelectField label="Тип ответа" value={question.type} onChange={(value) => updateQuestion(index, { type: value as QuestionType, answer: [] })} options={["single_choice", "multiple_choice", "text"]} labels={{ single_choice: "Один вариант", multiple_choice: "Несколько вариантов", text: "Ввод текста" }} />
          {question.type === "text" ? (
            <StudioField label="Правильный ответ" value={question.answer[0] ?? ""} onChange={(value) => updateQuestion(index, { answer: [value] })} />
          ) : (
            <div className="grid gap-2">
              {question.options.map((option, optionIndex) => {
                const selected = question.answer.includes(option);
                return (
                  <div key={`${option}-${optionIndex}`} className="grid min-w-0 gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                    <input type={question.type === "multiple_choice" ? "checkbox" : "radio"} checked={selected} onChange={() => updateQuestion(index, { answer: selectAnswer(question, option) })} />
                    <input className="h-10 min-w-0 rounded-xl border border-line px-3 text-sm outline-none focus:border-primary" value={option} onChange={(event) => updateQuestion(index, replaceOption(question, optionIndex, event.target.value))} />
                    <IconButton label="Удалить вариант" icon={<Trash2 size={15} />} danger onClick={() => updateQuestion(index, removeOption(question, optionIndex))} />
                  </div>
                );
              })}
              <button onClick={() => updateQuestion(index, { options: [...question.options, `Вариант ${question.options.length + 1}`] })} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line px-3 text-sm font-medium text-ink">
                <Plus size={15} />
                Добавить вариант
              </button>
            </div>
          )}
        </div>
      ))}
      <button onClick={() => onChange({ questions: [...questions, blankQuestion()] })} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-medium text-ink">
        <Plus size={15} />
        Добавить вопрос
      </button>
    </div>
  );
}

function PageHeader({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-panel sm:p-6">
      <div className="flex items-center gap-3">
        <div className="text-primary">{icon}</div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{text}</p>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl bg-surface p-4 text-sm leading-6 text-muted">{text}</p>;
}

function ActionCard({ icon, title, text, onClick }: { icon: ReactNode; title: string; text: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-line bg-white p-4 text-left transition hover:border-red-200 hover:bg-red-50/40">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-red-50 text-primary">{icon}</div>
      <h3 className="mt-4 font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
    </button>
  );
}

function IconButton({ icon, label, onClick, danger = false, disabled = false }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} title={label} disabled={disabled} className={`inline-flex h-9 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:border-line disabled:text-muted ${danger ? "border-red-100 text-primary hover:bg-red-50" : "border-line text-ink hover:border-red-200"}`}>
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  );
}

function SelectField({ label, value, onChange, options, labels = {} }: { label: string; value: string; onChange: (value: string) => void; options: string[]; labels?: Record<string, string> }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium text-ink">
      {label}
      <select className="h-11 min-w-0 rounded-xl border border-line px-3 outline-none focus:border-primary" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{labels[option] ?? option}</option>)}
      </select>
    </label>
  );
}

function DateTimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium text-ink">
      {label}
      <input className="h-11 min-w-0 rounded-xl border border-line px-3 outline-none focus:border-primary" type="datetime-local" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ownerForSession(session: Session | null): Owner {
  if (session?.user.role === "ADMIN") return "MAIN_COMPANY";
  if (session?.user.role === "PARTNER_MANAGER") return "PARTNER";
  return "COMPANY";
}

function isOwnedCourse(course: Course, owner: Owner, organizationId: string | null) {
  if (owner === "MAIN_COMPANY") return course.authorType === "MAIN_COMPANY";
  return course.authorType === owner && course.organizationId === organizationId;
}

function isOwnedIntensive(intensive: Intensive, owner: Owner, organizationId: string | null) {
  if (owner === "MAIN_COMPANY") return intensive.organizerType === "MAIN_COMPANY";
  return intensive.organizerType === owner && intensive.organizationId === organizationId;
}

function starterItems(): ContentItem[] {
  const folder = blankFolder(1);
  return [folder, blankLongread(folder.id, 1), blankTest(folder.id, 2)];
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try { return crypto.randomUUID(); } catch { /* fall through */ }
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function blankFolder(position: number): ContentItem {
  return { id: generateId(), parentId: null, type: "FOLDER", title: `Модуль ${position}`, htmlContent: null, testSchema: null, estimatedMinutes: 5, position };
}

function blankLongread(parentId: string | null, position: number): ContentItem {
  return { id: generateId(), parentId, type: "LONGREAD", title: "Материал", htmlContent: "<h2>Заголовок</h2><p>Напишите материал урока.</p><ul><li>Первый пункт</li><li>Второй пункт</li></ul>", testSchema: null, estimatedMinutes: 20, position };
}

function blankTest(parentId: string | null, position: number): ContentItem {
  return { id: generateId(), parentId, type: "TEST", title: "Тест", htmlContent: null, testSchema: { questions: [blankQuestion()] }, estimatedMinutes: 10, position };
}

function blankQuestion(): TestQuestion {
  return { type: "single_choice", title: "Новый вопрос", options: ["Вариант 1", "Вариант 2"], answer: ["Вариант 1"] };
}

function prepareItemsForSave(items: ContentItem[]) {
  return items.map((item, index) => ({
    ...item,
    htmlContent: item.type === "LONGREAD" ? item.htmlContent ?? "" : null,
    position: index + 1
  }));
}

function normalizeItems(items: ContentItem[]) {
  if (!items?.length) return starterItems();
  return items.map((item, index) => ({
    ...item,
    id: item.id ?? generateId(),
    parentId: item.parentId ?? null,
    htmlContent: item.type === "LONGREAD" && item.htmlContent ? normalizeLongreadContent(item.htmlContent) : item.htmlContent,
    estimatedMinutes: item.estimatedMinutes ?? 15,
    position: item.position ?? index + 1,
    testSchema: item.type === "TEST" ? item.testSchema ?? { questions: [blankQuestion()] } : null
  }));
}

function selectAnswer(question: TestQuestion, option: string) {
  if (question.type === "multiple_choice") {
    return question.answer.includes(option) ? question.answer.filter((item) => item !== option) : [...question.answer, option];
  }
  return [option];
}

function replaceOption(question: TestQuestion, optionIndex: number, value: string) {
  const oldValue = question.options[optionIndex];
  return {
    options: question.options.map((option, index) => (index === optionIndex ? value : option)),
    answer: question.answer.map((answer) => (answer === oldValue ? value : answer))
  };
}

function removeOption(question: TestQuestion, optionIndex: number) {
  const removed = question.options[optionIndex];
  return {
    options: question.options.filter((_, index) => index !== optionIndex),
    answer: question.answer.filter((answer) => answer !== removed)
  };
}

function normalizeLongreadContent(value: string) {
  return /<[a-z][\s\S]*>/i.test(value) ? value : markdownToHtml(value);
}

function markdownToHtml(source: string) {
  if (!source.trim()) return "";
  if (/<[a-z][\s\S]*>/i.test(source)) return source;
  const lines = source.split("\n");
  const html: string[] = [];
  let inList = false;
  let ordered = false;
  for (const line of lines) {
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inList || ordered) {
        if (inList) html.push("</ol>");
        html.push("<ul>");
        inList = true;
        ordered = false;
      }
      html.push(`<li>${escapeHtml(line.replace(/^\s*[-*]\s+/, ""))}</li>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (!inList || !ordered) {
        if (inList) html.push("</ul>");
        html.push("<ol>");
        inList = true;
        ordered = true;
      }
      html.push(`<li>${escapeHtml(line.replace(/^\s*\d+\.\s+/, ""))}</li>`);
      continue;
    }
    if (inList) {
      html.push(ordered ? "</ol>" : "</ul>");
      inList = false;
    }
    if (line.startsWith("### ")) html.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
    else if (line.startsWith("## ")) html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
    else if (line.startsWith("# ")) html.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
    else if (line.trim()) html.push(`<p>${escapeHtml(line)}</p>`);
  }
  if (inList) html.push(ordered ? "</ol>" : "</ul>");
  return html.join("");
}

function escapeHtml(value: string) {
  return value.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");
}

function starterStages() {
  return [blankStage(1), blankStage(2), blankStage(3)];
}

function fixedThreeStages(stages: IntensiveStageForm[]) {
  const next = stages.slice(0, 3);
  while (next.length < 3) {
    next.push(blankStage(next.length + 1));
  }
  return next.map((stage, index) => ({ ...stage, title: stage.title || `Этап ${index + 1}` }));
}

function blankStage(position: number): IntensiveStageForm {
  return {
    id: generateId(),
    startsAt: "",
    endsAt: "",
    title: `Этап ${position}`,
    description: position === 1 ? "Вводные материалы и первичная проверка." : position === 2 ? "Основная практическая работа." : "Финальная сдача и рейтинг.",
    taskTitle: `Задание этапа ${position}`,
    taskDescription: "Опишите, что участник должен сделать и отправить."
  };
}

function updateStage(stages: IntensiveStageForm[], setStages: (stages: IntensiveStageForm[]) => void, id: string, patch: Partial<IntensiveStageForm>) {
  setStages(stages.map((stage) => (stage.id === id ? { ...stage, ...patch } : stage)));
}

function toggleList(items: string[], value: string) {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

function toLocalDateTimeInput(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
}

function formatDateTime(value?: string) {
  if (!value) return "дата не указана";
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

type IntensiveDetails = {
  intensive: Intensive;
  stages: Array<{
    id: string;
    title: string;
    description: string;
    taskTitle: string;
    taskDescription: string;
    startsAt?: string;
    endsAt?: string;
  }>;
};
