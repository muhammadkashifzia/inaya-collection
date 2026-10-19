import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/utils";

/* ------------------------------------------------------------------ types */

type ToastTone = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  message?: string;
  /** Auto-dismiss delay in ms (0 = sticky). Default 4000. */
  duration: number;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (opts: { tone: ToastTone; title: string; message?: string; duration?: number }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismiss: (id: number) => void;
}

/* --------------------------------------------------------------- context */

const ToastCtx = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/* --------------------------------------------------------------- icons */

const icons: Record<ToastTone, ReactNode> = {
  success: (
    <svg className="fill-current" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2a10 10 0 110 20 10 10 0 010-20zm4.03 7.47a.75.75 0 010 1.06l-5 5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 111.06-1.06L10.5 13.94l4.47-4.47a.75.75 0 011.06 0z" />
    </svg>
  ),
  error: (
    <svg className="fill-current" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2a10 10 0 110 20 10 10 0 010-20zm1 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-4.5A.75.75 0 0012 7z" />
    </svg>
  ),
  warning: (
    <svg className="fill-current" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2a10 10 0 110 20 10 10 0 010-20zm1 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-4.5A.75.75 0 0012 7z" />
    </svg>
  ),
  info: (
    <svg className="fill-current" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2a10 10 0 110 20 10 10 0 010-20zm1 7a1 1 0 11-2 0 1 1 0 012 0zm-.25 3a.75.75 0 00-1.5 0v4a.75.75 0 001.5 0v-4z" />
    </svg>
  ),
};

const toneColors: Record<ToastTone, { bg: string; icon: string; border: string }> = {
  success: { bg: "bg-success-50 dark:bg-success-500/10", icon: "text-success-500", border: "border-success-300 dark:border-success-500/30" },
  error: { bg: "bg-error-50 dark:bg-error-500/10", icon: "text-error-500", border: "border-error-300 dark:border-error-500/30" },
  warning: { bg: "bg-warning-50 dark:bg-warning-500/10", icon: "text-warning-500", border: "border-warning-300 dark:border-warning-500/30" },
  info: { bg: "bg-blue-light-50 dark:bg-blue-light-500/10", icon: "text-blue-light-500", border: "border-blue-light-300 dark:border-blue-light-500/30" },
};

/* ------------------------------------------------------------- provider */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300);
  }, []);

  const toast = useCallback(
    ({ tone, title, message, duration = 4000 }: { tone: ToastTone; title: string; message?: string; duration?: number }) => {
      const id = ++nextId.current;
      setToasts((prev) => [...prev, { id, tone, title, message, duration }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, message) => toast({ tone: "success", title, message }),
      error: (title, message) => toast({ tone: "error", title, message, duration: 6000 }),
      warning: (title, message) => toast({ tone: "warning", title, message, duration: 5000 }),
      info: (title, message) => toast({ tone: "info", title, message }),
      dismiss,
    }),
    [toast, dismiss],
  );

  return (
    <ToastCtx.Provider value={value}>
      {children}

      {/* Toast container — top-end, above everything */}
      <div aria-live="polite" className="pointer-events-none fixed end-0 top-0 z-99999 flex flex-col items-end gap-2 p-4 sm:p-6">
        {toasts.map((t) => {
          const c = toneColors[t.tone];
          return (
            <div
              key={t.id}
              role={t.tone === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border p-4 shadow-theme-md transition-all duration-300",
                c.bg,
                c.border,
                t.exiting ? "translate-x-full opacity-0" : "animate-[slide-in-right_0.3s_ease-out]",
              )}
            >
              <span className={cn("mt-0.5 shrink-0", c.icon)}>{icons[t.tone]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{t.title}</p>
                {t.message && <p className="mt-0.5 text-theme-xs text-gray-600 dark:text-gray-400">{t.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Dismiss"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
