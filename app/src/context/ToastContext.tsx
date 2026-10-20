"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/format";

/* ------------------------------------------------------------------ types */

type ToastTone = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  message?: string;
  duration: number;
  exiting?: boolean;
}

interface ToastContextValue {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

/* --------------------------------------------------------------- context */

const ToastCtx = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/* --------------------------------------------------------------- config */

const toneConfig: Record<ToastTone, { card: string; icon: string; iconBg: string }> = {
  success: {
    card: "border-[#22c55e] bg-[#f0fdf4]",
    iconBg: "bg-[#22c55e]",
    icon: "text-white",
  },
  error: {
    card: "border-[#ef4444] bg-[#fef2f2]",
    iconBg: "bg-[#ef4444]",
    icon: "text-white",
  },
  info: {
    card: "border-[#3b82f6] bg-[#eff6ff]",
    iconBg: "bg-[#3b82f6]",
    icon: "text-white",
  },
  warning: {
    card: "border-[#eab308] bg-[#fefce8]",
    iconBg: "bg-[#eab308]",
    icon: "text-white",
  },
};

const icons: Record<ToastTone, ReactNode> = {
  success: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  error: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  warning: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

/* ------------------------------------------------------------- provider */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300);
  }, []);

  const show = useCallback(
    (tone: ToastTone, title: string, message?: string, duration = 4000) => {
      const id = ++nextId.current;
      setToasts((prev) => [...prev.slice(-4), { id, tone, title, message, duration }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (title, message) => show("success", title, message),
      error: (title, message) => show("error", title, message, 5000),
      info: (title, message) => show("info", title, message),
      warning: (title, message) => show("warning", title, message, 5000),
    }),
    [show],
  );

  return (
    <ToastCtx.Provider value={value}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-auto right-0 top-0 z-[60] flex flex-col items-end gap-3 p-4 md:p-6"
      >
        {toasts.map((t) => {
          const cfg = toneConfig[t.tone];
          return (
            <div
              key={t.id}
              role={t.tone === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-md border bg-white px-3.5 py-2.5 shadow-lg transition-all duration-300",
                cfg.card,
                t.exiting ? "translate-y-2 opacity-0 md:-translate-y-0 md:translate-x-full" : "animate-[toast-in_0.3s_ease-out]",
              )}
            >
              {/* Circular icon */}
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", cfg.iconBg, cfg.icon)}>
                {icons[t.tone]}
              </span>

              {/* Title + message */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight text-gray-900">{t.title}</p>
                {t.message && <p className="mt-0.5 text-xs leading-snug text-gray-500">{t.message}</p>}
              </div>

              {/* Close ⊗ button */}
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-gray-400 hover:text-gray-600"
                aria-label="Dismiss"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
