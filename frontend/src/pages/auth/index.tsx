import { apiRequest } from "@/shared/api/client";
import type { Session } from "@/shared/auth/session";
import { navigate } from "@/shared/router";
import { toastError, toastSuccess } from "@/shared/ui/toast";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Building2,
  CheckCircle2,
  GraduationCap,
  LogIn,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

export type RegisterKind = "user" | "company";

type CompanyRegistration = {
  organization: { id: string; name: string };
  managerUserId: string;
};

// ─── Left panel (brand side) ─────────────────────────────────────────────────

function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-hero-gradient p-10 lg:flex xl:p-12">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[15%] h-72 w-72 rounded-full bg-primary/25 blur-[90px]" />
        <div className="absolute right-[-5%] top-[-5%] h-56 w-56 rounded-full bg-red-800/25 blur-[70px]" />
        <div className="absolute bottom-[-5%] left-[30%] h-48 w-80 rounded-full bg-primary/15 blur-[80px]" />
      </div>

      {/* Logo */}
      <div className="relative">
        <button
          onClick={() => navigate("/")}
          className="group flex items-center gap-3 text-left"
        >
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur-sm transition group-hover:bg-white/20">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <p className="text-[16px] font-bold leading-none tracking-tight text-white">
              РедАкадемия
            </p>
            <p className="mt-0.5 text-[11px] text-white/50">
              Образовательная платформа
            </p>
          </div>
        </button>
      </div>

      {/* Main content */}
      <div className="relative space-y-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm">
            <Sparkles size={11} className="text-primary" />
            Платформа нового поколения
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.12] tracking-tight text-white xl:text-[42px]">
            Учитесь. Растите.
            <br />
            <span className="text-gradient">Становитесь лучше.</span>
          </h1>
          <p className="mt-4 text-[14px] leading-7 text-white/55">
            Курсы, интенсивы, корпоративное обучение и сертификаты —
            всё в одном месте.
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

      {/* Footer */}
      <div className="relative flex items-center gap-2 text-[12px] text-white/30">
        <CheckCircle2 size={12} className="text-primary/70" />
        Безопасная платформа РедСофт
      </div>
    </div>
  );
}

// ─── Role Card ────────────────────────────────────────────────────────────────

function RoleCard({
  title,
  subtitle,
  description,
  icon: Icon,
  accentClass,
  bgClass,
  onClick,
}: {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  accentClass: string;
  bgClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border-2 border-line bg-white p-6 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_8px_30px_rgba(220,38,38,0.12)]"
    >
      <div
        className={`grid h-12 w-12 place-items-center rounded-xl ${bgClass} transition-transform duration-200 group-hover:scale-110`}
      >
        <Icon size={22} className={accentClass} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <h3 className="text-[16px] font-bold text-ink">{title}</h3>
          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-muted">
            {subtitle}
          </span>
        </div>
        <p className="text-[13px] leading-5 text-muted">{description}</p>
      </div>

      <div
        className={`flex items-center gap-1.5 text-[13px] font-semibold transition-all duration-200 group-hover:gap-2.5 ${accentClass}`}
      >
        Продолжить
        <ArrowUpRight size={14} />
      </div>
    </button>
  );
}

// ─── Main Auth Page ───────────────────────────────────────────────────────────

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  async function submit() {
    setLoading(true);
    try {
      if (isLogin) {
        const session = await apiRequest<Session>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        onSessionChange(session);
        toastSuccess("Вы вошли в аккаунт");
        navigate("/");
        return;
      }

      if (registerKind === "user") {
        const session = await apiRequest<Session>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password, fullName }),
        });
        onSessionChange(session);
        toastSuccess(
          "Аккаунт создан",
          "Профиль уже открыт — заполните данные и записывайтесь на курсы."
        );
        navigate("/profile");
        return;
      }

      if (registerKind === "company") {
        await apiRequest<CompanyRegistration>(
          "/api/organizations/company-registration",
          {
            method: "POST",
            body: JSON.stringify({
              companyName,
              contactEmail: email,
              password,
              description,
            }),
          }
        );
        const session = await apiRequest<Session>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        onSessionChange(session);
        toastSuccess(
          "Компания зарегистрирована",
          "Заявка на партнёрство подаётся из профиля."
        );
        navigate("/profile");
        return;
      }
    } catch {
      toastError(
        isLogin ? "Не удалось войти" : "Не удалось зарегистрироваться",
        isLogin
          ? "Проверьте email и пароль."
          : "Проверьте поля и попробуйте ещё раз."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[45%_55%] xl:grid-cols-[42%_58%]">
      <BrandPanel />

      {/* Right: form panel */}
      <div className="flex items-center justify-center bg-white px-6 py-12 sm:px-10">
        <div className="w-full max-w-[420px]">
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

          {!isLogin && registerKind === null ? (
            <RegisterRolePicker setRegisterKind={setRegisterKind} />
          ) : (
            <AuthForm
              isLogin={isLogin}
              registerKind={registerKind}
              setRegisterKind={setRegisterKind}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              fullName={fullName}
              setFullName={setFullName}
              companyName={companyName}
              setCompanyName={setCompanyName}
              description={description}
              setDescription={setDescription}
              loading={loading}
              onSubmit={submit}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Register: role picker ────────────────────────────────────────────────────

function RegisterRolePicker({
  setRegisterKind,
}: {
  setRegisterKind: (k: RegisterKind) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-ink">
          Создать аккаунт
        </h1>
        <p className="mt-2 text-[14px] leading-6 text-muted">
          Выберите тип аккаунта, чтобы продолжить
        </p>
      </div>

      <div className="grid gap-3">
        <RoleCard
          title="Я студент"
          subtitle="Для учёбы"
          description="Хочу проходить курсы, участвовать в интенсивах и получать сертификаты"
          icon={GraduationCap}
          accentClass="text-primary"
          bgClass="bg-primary-light"
          onClick={() => setRegisterKind("user")}
        />
        <RoleCard
          title="Я компания"
          subtitle="Для бизнеса"
          description="Хочу публиковать корпоративные курсы и обучать своих сотрудников"
          icon={Building2}
          accentClass="text-blue-600"
          bgClass="bg-blue-50"
          onClick={() => setRegisterKind("company")}
        />
      </div>

      <p className="text-center text-[13px] text-muted">
        Уже есть аккаунт?{" "}
        <button
          onClick={() => navigate("/login")}
          className="font-semibold text-primary hover:underline"
        >
          Войти
        </button>
      </p>
    </div>
  );
}

// ─── Auth form ────────────────────────────────────────────────────────────────

function AuthForm({
  isLogin,
  registerKind,
  setRegisterKind,
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  companyName,
  setCompanyName,
  description,
  setDescription,
  loading,
  onSubmit,
}: {
  isLogin: boolean;
  registerKind: RegisterKind | null;
  setRegisterKind: (k: RegisterKind | null) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  fullName: string;
  setFullName: (v: string) => void;
  companyName: string;
  setCompanyName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  loading: boolean;
  onSubmit: () => void;
}) {
  const isCompany = registerKind === "company";

  const heading = isLogin
    ? "Добро пожаловать"
    : isCompany
    ? "Регистрация компании"
    : "Регистрация студента";

  const subheading = isLogin
    ? "Войдите в свой аккаунт"
    : isCompany
    ? "Партнёрство оформляется из профиля после входа"
    : "Доступ к курсам, интенсивам и сертификатам";

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !loading) onSubmit();
  }

  return (
    <div className="space-y-6" onKeyDown={handleKeyDown}>
      {!isLogin && (
        <button
          onClick={() => setRegisterKind(null)}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition hover:text-ink"
        >
          <ArrowLeft size={14} />
          Выбрать другой тип
        </button>
      )}

      <div>
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary-light text-primary">
          {isLogin ? (
            <LogIn size={22} />
          ) : isCompany ? (
            <Building2 size={22} />
          ) : (
            <GraduationCap size={22} />
          )}
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink">
          {heading}
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">{subheading}</p>
      </div>

      <div className="space-y-3">
        {!isLogin && isCompany && (
          <Field
            label="Название компании"
            value={companyName}
            onChange={setCompanyName}
            placeholder="ООО «Технологии»"
          />
        )}
        {!isLogin && !isCompany && (
          <Field
            label="ФИО"
            value={fullName}
            onChange={setFullName}
            placeholder="Иван Иванович Иванов"
          />
        )}
        <Field
          label={!isLogin && isCompany ? "Рабочий email" : "Email"}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="example@company.ru"
          autoComplete="email"
        />
        <Field
          label="Пароль"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder={isLogin ? "Введите пароль" : "Минимум 8 символов"}
          autoComplete={isLogin ? "current-password" : "new-password"}
        />
        {!isLogin && isCompany && (
          <Field
            label="Описание компании"
            value={description}
            onChange={setDescription}
            multiline
            placeholder="Чем занимается ваша компания..."
          />
        )}
      </div>

      <div className="space-y-2.5">
        <button
          disabled={loading}
          onClick={onSubmit}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-gradient text-[14px] font-semibold text-white shadow-red-sm transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Отправляю...
            </span>
          ) : isLogin ? (
            "Войти"
          ) : isCompany ? (
            "Зарегистрировать компанию"
          ) : (
            "Создать аккаунт"
          )}
        </button>

        <button
          onClick={() => {
            if (isLogin) {
              navigate("/register");
            } else {
              setRegisterKind(null);
            }
          }}
          className="flex h-11 w-full items-center justify-center rounded-xl border border-line text-[13px] font-medium text-muted transition hover:border-primary/30 hover:text-ink"
        >
          {isLogin ? "Нет аккаунта? Зарегистрироваться" : "← Назад"}
        </button>
      </div>

      {isLogin && (
        <p className="text-center text-[12px] text-muted/70">
          После входа платформа покажет только доступные вам разделы.
        </p>
      )}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  const base =
    "w-full rounded-xl border border-line bg-white text-[14px] text-ink outline-none transition placeholder:text-muted/40 focus:border-primary focus:ring-4 focus:ring-primary/8";

  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-medium text-ink/80">{label}</span>
      {multiline ? (
        <textarea
          className={`${base} min-h-[88px] resize-none px-3.5 py-3`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          className={`${base} h-11 px-3.5`}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
      )}
    </label>
  );
}
