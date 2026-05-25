import { apiRequest } from "@/shared/api/client";
import type { Session } from "@/shared/auth/session";
import { navigate } from "@/shared/router";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LogIn,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export type RegisterKind = "user" | "company";

type CompanyRegistration = {
  organization: { id: string; name: string };
  managerUserId: string;
};

// ─── Brand panel ─────────────────────────────────────────────────────────────

function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-hero-gradient p-10 lg:flex xl:p-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[15%] h-72 w-72 rounded-full bg-primary/25 blur-[90px]" />
        <div className="absolute right-[-5%] top-[-5%] h-56 w-56 rounded-full bg-red-800/25 blur-[70px]" />
        <div className="absolute bottom-[-5%] left-[30%] h-48 w-80 rounded-full bg-primary/15 blur-[80px]" />
      </div>
      <div className="relative">
        <button onClick={() => navigate("/")} className="group flex items-center gap-3 text-left">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur-sm transition group-hover:bg-white/20">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <p className="text-[16px] font-bold leading-none tracking-tight text-white">РедАкадемия</p>
            <p className="mt-0.5 text-[11px] text-white/50">Образовательная платформа</p>
          </div>
        </button>
      </div>
      <div className="relative space-y-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm">
            <Sparkles size={11} className="text-primary" />
            Платформа нового поколения
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.12] tracking-tight text-white xl:text-[42px]">
            Учитесь. Растите.<br />
            <span className="text-gradient">Становитесь лучше.</span>
          </h1>
          <p className="mt-4 text-[14px] leading-7 text-white/55">
            Курсы, интенсивы, корпоративное обучение и сертификаты — всё в одном месте.
          </p>
        </div>
        <div className="space-y-3">
          {[
            { icon: BookOpen, text: "Курсы от экспертов и партнёров" },
            { icon: Trophy, text: "Трёхэтапные интенсивы с наставниками" },
            { icon: Users, text: "Корпоративное обучение для команд" },
            { icon: Zap, text: "Сертификаты и трекинг прогресса" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-white/80">
                <Icon size={14} />
              </div>
              <span className="text-[13px] text-white/65">{text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative flex items-center gap-2 text-[12px] text-white/30">
        <CheckCircle2 size={12} className="text-primary/70" />
        Безопасная платформа РедСофт
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="mb-8 flex items-center gap-0">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold transition-all
                  ${done ? "bg-primary text-white" : active ? "bg-primary text-white ring-4 ring-primary/20" : "bg-surface text-muted"}`}
              >
                {done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={`mt-1 hidden text-[10px] font-medium sm:block ${active ? "text-primary" : done ? "text-ink" : "text-muted"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-1 h-0.5 flex-1 rounded-full transition-all ${done ? "bg-primary" : "bg-line"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
  placeholder,
  autoComplete,
  hint,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const base = "w-full rounded-xl border border-line bg-white text-[14px] text-ink outline-none transition placeholder:text-muted/40 focus:border-primary focus:ring-4 focus:ring-primary/8";

  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-1 text-[13px] font-medium text-ink/80">
        {label}
        {required && <span className="text-primary">*</span>}
      </span>
      {multiline ? (
        <textarea className={`${base} min-h-[80px] resize-none px-3.5 py-3`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : isPassword ? (
        <div className="relative">
          <input className={`${base} h-11 px-3.5 pr-10`} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition">
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      ) : (
        <input className={`${base} h-11 px-3.5`} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} />
      )}
      {hint && <p className="text-[11px] text-muted">{hint}</p>}
    </label>
  );
}

// ─── Password strength ────────────────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-400"];
  const labels = ["Слабый", "Средний", "Хороший", "Сильный"];
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : "bg-line"}`} />
        ))}
      </div>
      <p className={`text-[11px] font-medium ${score >= 3 ? "text-emerald-600" : score >= 2 ? "text-yellow-600" : "text-orange-600"}`}>
        Пароль: {labels[score - 1] ?? "Слабый"}
      </p>
    </div>
  );
}

// ─── Login form ───────────────────────────────────────────────────────────────

function LoginForm({ onSessionChange }: { onSessionChange: (s: Session) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email || !password) { toastError("Заполните все поля"); return; }
    setLoading(true);
    try {
      const session = await apiRequest<Session>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      onSessionChange(session);
      toastSuccess("Добро пожаловать!", "Вы успешно вошли в аккаунт.");
      navigate("/");
    } catch {
      toastError("Не удалось войти", "Проверьте email и пароль.");
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6" onKeyDown={(e) => e.key === "Enter" && !loading && submit()}>
      <div>
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary-light text-primary">
          <LogIn size={22} />
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink">Добро пожаловать</h1>
        <p className="mt-1.5 text-[13px] text-muted">Войдите в свой аккаунт</p>
      </div>
      <div className="space-y-3">
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="example@mail.ru" autoComplete="email" required />
        <Field label="Пароль" type="password" value={password} onChange={setPassword} placeholder="Введите пароль" autoComplete="current-password" required />
      </div>
      <div className="space-y-2.5">
        <button disabled={loading} onClick={submit} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-gradient text-[14px] font-semibold text-white shadow-red-sm transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? <Spinner /> : "Войти"}
        </button>
        <button onClick={() => navigate("/register")} className="flex h-11 w-full items-center justify-center rounded-xl border border-line text-[13px] font-medium text-muted transition hover:border-primary/30 hover:text-ink">
          Нет аккаунта? Зарегистрироваться
        </button>
      </div>
      <p className="text-center text-[12px] text-muted/70">
        После входа платформа покажет только доступные вам разделы.
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <span className="flex items-center gap-2">
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Отправляю...
    </span>
  );
}

// ─── Register wizard — student ────────────────────────────────────────────────

const STUDENT_STEPS = ["Тип", "Данные", "Согласие"];
const COMPANY_STEPS = ["Тип", "Менеджер", "Компания", "Согласие"];

function StudentWizard({ onBack, onSessionChange }: { onBack: () => void; onSessionChange: (s: Session) => void }) {
  const [step, setStep] = useState(0); // 0 = personal, 1 = consent
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  function validatePersonal() {
    if (!fullName.trim()) { toastError("Введите ваше ФИО"); return false; }
    if (!email.trim() || !email.includes("@")) { toastError("Введите корректный email"); return false; }
    if (password.length < 8) { toastError("Пароль минимум 8 символов"); return false; }
    return true;
  }

  async function submit() {
    if (!consent) { toastError("Необходимо согласие на обработку данных"); return; }
    setLoading(true);
    try {
      const session = await apiRequest<Session>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, fullName }),
      });
      onSessionChange(session);
      toastSuccess("Аккаунт создан!", "Добро пожаловать на платформу.");
      navigate("/");
    } catch {
      toastError("Не удалось зарегистрироваться", "Проверьте данные и попробуйте снова.");
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-5">
      <button onClick={step === 0 ? onBack : () => setStep(0)} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition hover:text-ink">
        <ArrowLeft size={14} />
        {step === 0 ? "Выбрать тип" : "Назад"}
      </button>
      <StepIndicator steps={STUDENT_STEPS} current={step + 1} />

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="personal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
            <div>
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-primary-light text-primary">
                <GraduationCap size={20} />
              </div>
              <h1 className="text-[22px] font-bold tracking-tight text-ink">Личные данные</h1>
              <p className="mt-1 text-[13px] text-muted">Заполните информацию для создания аккаунта</p>
            </div>
            <div className="space-y-3">
              <Field label="ФИО" value={fullName} onChange={setFullName} placeholder="Иван Иванович Иванов" autoComplete="name" required />
              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="example@mail.ru" autoComplete="email" required />
              <div className="space-y-2">
                <Field label="Пароль" type="password" value={password} onChange={setPassword} placeholder="Минимум 8 символов" autoComplete="new-password" required />
                <PasswordStrength password={password} />
              </div>
            </div>
            <button onClick={() => { if (validatePersonal()) setStep(1); }} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-gradient text-[13px] font-semibold text-white shadow-red-sm transition hover:opacity-90">
              Далее <ArrowRight size={15} />
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="consent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
            <div>
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck size={20} />
              </div>
              <h1 className="text-[22px] font-bold tracking-tight text-ink">Подтверждение</h1>
              <p className="mt-1 text-[13px] text-muted">Проверьте данные и примите условия</p>
            </div>
            {/* Summary */}
            <div className="rounded-2xl bg-surface p-4 space-y-2">
              <SummaryRow label="ФИО" value={fullName} />
              <SummaryRow label="Email" value={email} />
            </div>
            {/* Consent */}
            <ConsentBlock checked={consent} onChange={setConsent} />
            <button onClick={submit} disabled={loading || !consent} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-gradient text-[14px] font-semibold text-white shadow-red-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <Spinner /> : "Создать аккаунт"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Register wizard — company ────────────────────────────────────────────────

function CompanyWizard({ onBack, onSessionChange }: { onBack: () => void; onSessionChange: (s: Session) => void }) {
  const [step, setStep] = useState(0); // 0=manager, 1=company, 2=consent
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [inn, setInn] = useState("");
  const [ogrn, setOgrn] = useState("");
  const [description, setDescription] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  function validateManager() {
    if (!fullName.trim()) { toastError("Введите ваше ФИО"); return false; }
    if (!email.trim() || !email.includes("@")) { toastError("Введите корректный email"); return false; }
    if (password.length < 8) { toastError("Пароль минимум 8 символов"); return false; }
    return true;
  }

  function validateCompany() {
    if (!companyName.trim()) { toastError("Введите название компании"); return false; }
    if (inn && !/^\d{10}$|^\d{12}$/.test(inn.replace(/\s/g, ""))) { toastError("ИНН должен содержать 10 или 12 цифр"); return false; }
    if (ogrn && !/^\d{13}$|^\d{15}$/.test(ogrn.replace(/\s/g, ""))) { toastError("ОГРН должен содержать 13 или 15 цифр"); return false; }
    return true;
  }

  async function submit() {
    if (!consent) { toastError("Необходимо согласие на обработку данных"); return; }
    setLoading(true);
    try {
      await apiRequest<CompanyRegistration>("/api/organizations/company-registration", {
        method: "POST",
        body: JSON.stringify({ companyName, contactEmail: email, password, managerFullName: fullName, description, inn: inn || null, ogrn: ogrn || null }),
      });
      const session = await apiRequest<Session>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      onSessionChange(session);
      toastSuccess("Компания зарегистрирована!", "Подайте заявку на партнёрство из профиля.");
      navigate("/profile");
    } catch {
      toastError("Не удалось зарегистрироваться", "Проверьте данные и попробуйте снова.");
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-5">
      <button
        onClick={step === 0 ? onBack : () => setStep((s) => s - 1)}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition hover:text-ink"
      >
        <ArrowLeft size={14} />
        {step === 0 ? "Выбрать тип" : "Назад"}
      </button>
      <StepIndicator steps={COMPANY_STEPS} current={step + 1} />

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="manager" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
            <div>
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <Users size={20} />
              </div>
              <h1 className="text-[22px] font-bold tracking-tight text-ink">Данные менеджера</h1>
              <p className="mt-1 text-[13px] text-muted">Контактное лицо от компании</p>
            </div>
            <div className="space-y-3">
              <Field label="ФИО представителя" value={fullName} onChange={setFullName} placeholder="Иван Иванович Иванов" autoComplete="name" required />
              <Field label="Рабочий email" type="email" value={email} onChange={setEmail} placeholder="manager@company.ru" autoComplete="email" required />
              <div className="space-y-2">
                <Field label="Пароль" type="password" value={password} onChange={setPassword} placeholder="Минимум 8 символов" autoComplete="new-password" required />
                <PasswordStrength password={password} />
              </div>
            </div>
            <button onClick={() => { if (validateManager()) setStep(1); }} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-gradient text-[13px] font-semibold text-white shadow-red-sm transition hover:opacity-90">
              Далее <ArrowRight size={15} />
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="company" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
            <div>
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <Building2 size={20} />
              </div>
              <h1 className="text-[22px] font-bold tracking-tight text-ink">Данные компании</h1>
              <p className="mt-1 text-[13px] text-muted">Юридическая информация об организации</p>
            </div>
            <div className="space-y-3">
              <Field label="Название компании" value={companyName} onChange={setCompanyName} placeholder='ООО «Технологии»' required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="ИНН" value={inn} onChange={setInn} placeholder="1234567890" hint="10 или 12 цифр" />
                <Field label="ОГРН" value={ogrn} onChange={setOgrn} placeholder="1234567890123" hint="13 или 15 цифр" />
              </div>
              <Field label="Описание деятельности" value={description} onChange={setDescription} multiline placeholder="Чем занимается ваша компания..." />
            </div>
            <button onClick={() => { if (validateCompany()) setStep(2); }} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-gradient text-[13px] font-semibold text-white shadow-red-sm transition hover:opacity-90">
              Далее <ArrowRight size={15} />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="consent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
            <div>
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck size={20} />
              </div>
              <h1 className="text-[22px] font-bold tracking-tight text-ink">Подтверждение</h1>
              <p className="mt-1 text-[13px] text-muted">Проверьте данные и примите условия</p>
            </div>
            <div className="rounded-2xl bg-surface p-4 space-y-2">
              <SummaryRow label="Представитель" value={fullName} />
              <SummaryRow label="Email" value={email} />
              <SummaryRow label="Компания" value={companyName} />
              {inn && <SummaryRow label="ИНН" value={inn} />}
              {ogrn && <SummaryRow label="ОГРН" value={ogrn} />}
            </div>
            <ConsentBlock checked={consent} onChange={setConsent} />
            <button onClick={submit} disabled={loading || !consent} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-gradient text-[14px] font-semibold text-white shadow-red-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <Spinner /> : "Зарегистрировать компанию"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[13px]">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink truncate max-w-[200px]">{value}</span>
    </div>
  );
}

function ConsentBlock({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all ${checked ? "border-primary/30 bg-primary/5" : "border-line bg-surface hover:border-primary/20"}`}
    >
      <div className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition-all ${checked ? "border-primary bg-primary text-white" : "border-line bg-white"}`}>
        {checked && <CheckCircle2 size={12} />}
      </div>
      <p className="text-[12px] leading-5 text-muted">
        Я даю согласие на обработку персональных данных в соответствии с{" "}
        <a
          href="/privacy"
          onClick={(e) => { e.stopPropagation(); navigate("/privacy"); }}
          className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
        >
          Федеральным законом №152-ФЗ «О персональных данных»
        </a>.
        Данные используются исключительно для работы платформы РедАкадемия.
      </p>
    </button>
  );
}

// ─── Role picker ──────────────────────────────────────────────────────────────

function RolePicker({ onSelect }: { onSelect: (k: RegisterKind) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink">Создать аккаунт</h1>
        <p className="mt-2 text-[13px] leading-5 text-muted">Выберите тип аккаунта, чтобы продолжить</p>
      </div>
      <div className="grid gap-3">
        {[
          {
            kind: "user" as RegisterKind,
            icon: GraduationCap,
            title: "Я студент",
            sub: "Для учёбы",
            text: "Прохожу курсы, участвую в интенсивах и получаю сертификаты",
            accent: "text-primary",
            bg: "bg-primary-light",
            border: "hover:border-primary",
            glow: "hover:shadow-[0_8px_30px_rgba(220,38,38,0.12)]",
          },
          {
            kind: "company" as RegisterKind,
            icon: Building2,
            title: "Я компания",
            sub: "Для бизнеса",
            text: "Публикую корпоративные курсы и обучаю сотрудников",
            accent: "text-blue-600",
            bg: "bg-blue-50",
            border: "hover:border-blue-300",
            glow: "hover:shadow-[0_8px_30px_rgba(37,99,235,0.10)]",
          },
        ].map(({ kind, icon: Icon, title, sub, text, accent, bg, border, glow }) => (
          <button
            key={kind}
            onClick={() => onSelect(kind)}
            className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border-2 border-line bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 ${border} ${glow}`}
          >
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${bg} transition-transform duration-200 group-hover:scale-110`}>
              <Icon size={22} className={accent} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-ink">{title}</span>
                <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-muted">{sub}</span>
              </div>
              <p className="mt-0.5 text-[12px] leading-4 text-muted">{text}</p>
            </div>
            <ArrowRight size={16} className={`shrink-0 transition-all duration-200 group-hover:translate-x-1 ${accent}`} />
          </button>
        ))}
      </div>
      <p className="text-center text-[13px] text-muted">
        Уже есть аккаунт?{" "}
        <button onClick={() => navigate("/login")} className="font-semibold text-primary hover:underline">
          Войти
        </button>
      </p>
    </div>
  );
}

// ─── Main AuthPage ────────────────────────────────────────────────────────────

export function AuthPage({
  mode,
  initialKind = "user",
  onSessionChange,
}: {
  mode: "login" | "register";
  initialKind?: RegisterKind;
  onSessionChange: (session: Session) => void;
}) {
  const [registerKind, setRegisterKind] = useState<RegisterKind | null>(
    mode === "register" ? null : initialKind
  );

  return (
    <div className="grid min-h-screen lg:grid-cols-[45%_55%] xl:grid-cols-[42%_58%]">
      <BrandPanel />
      <div className="flex items-center justify-center bg-white px-6 py-12 sm:px-10">
        <div className="w-full max-w-[440px]">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-gradient shadow-red-sm">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-ink">РедАкадемия</p>
              <p className="text-[11px] text-muted">Образовательная платформа</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.div key="login" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <LoginForm onSessionChange={onSessionChange} />
              </motion.div>
            ) : registerKind === null ? (
              <motion.div key="picker" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <RolePicker onSelect={setRegisterKind} />
              </motion.div>
            ) : registerKind === "user" ? (
              <motion.div key="student" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <StudentWizard onBack={() => setRegisterKind(null)} onSessionChange={onSessionChange} />
              </motion.div>
            ) : (
              <motion.div key="company" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <CompanyWizard onBack={() => setRegisterKind(null)} onSessionChange={onSessionChange} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
