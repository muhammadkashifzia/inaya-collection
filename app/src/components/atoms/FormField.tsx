import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/format";

interface FieldProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
}

const inputClass =
  "h-11 w-full border bg-white px-3 text-sm outline-none transition-colors focus:border-ink aria-[invalid=true]:border-brand";

/** Labelled input with an accessible error message. */
export function TextField({ label, error, hint, className, id, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-widest text-ink">
        {label}
        {props.required && <span aria-hidden="true" className="text-brand"> *</span>}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(inputClass, "border-line")}
        {...props}
      />
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p id={errorId} className="text-xs font-semibold text-brand">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextAreaField({ label, error, hint, className, id, ...props }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-widest text-ink">
        {label}
        {props.required && <span aria-hidden="true" className="text-brand"> *</span>}
      </label>
      <textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="min-h-24 w-full border border-line bg-white p-3 text-sm outline-none focus:border-ink aria-[invalid=true]:border-brand"
        {...props}
      />
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p id={errorId} className="text-xs font-semibold text-brand">
          {error}
        </p>
      )}
    </div>
  );
}

/** Form-level status message (success / error), announced to screen readers. */
export function FormAlert({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "px-4 py-3 text-sm font-medium",
        tone === "error" && "bg-brand/10 text-brand",
        tone === "success" && "bg-emerald-50 text-emerald-800",
        tone === "info" && "bg-cream text-ink",
      )}
    >
      {children}
    </p>
  );
}
