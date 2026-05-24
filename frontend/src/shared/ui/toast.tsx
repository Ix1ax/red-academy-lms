import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

type ToastTone = "success" | "error";

type ToastPayload = {
  tone: ToastTone;
  title: string;
  text?: string;
};

type ToastItem = ToastPayload & {
  id: number;
};

const toastEvent = "lms-toast";

export function showToast(payload: ToastPayload) {
  window.dispatchEvent(new CustomEvent<ToastPayload>(toastEvent, { detail: payload }));
}

export function toastSuccess(title: string, text?: string) {
  showToast({ tone: "success", title, text });
}

export function toastError(title: string, text?: string) {
  showToast({ tone: "error", title, text });
}

export function ToastViewport() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onToast(event: Event) {
      const detail = (event as CustomEvent<ToastPayload>).detail;
      const id = Date.now() + Math.random();
      setItems((current) => [...current.slice(-2), { ...detail, id }]);
      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
      }, 4200);
    }

    window.addEventListener(toastEvent, onToast);
    return () => window.removeEventListener(toastEvent, onToast);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed right-4 top-20 z-50 grid w-[min(420px,calc(100vw-2rem))] gap-3">
      {items.map((item) => {
        const Icon = item.tone === "success" ? CheckCircle2 : XCircle;
        return (
          <div
            key={item.id}
            className={`rounded-2xl border bg-white px-4 py-3 shadow-panel ${
              item.tone === "success" ? "border-emerald-100" : "border-red-100"
            }`}
          >
            <div className="flex gap-3">
              <Icon className={item.tone === "success" ? "text-emerald-600" : "text-primary"} size={20} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                {item.text && <p className="mt-1 text-sm leading-5 text-muted">{item.text}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
