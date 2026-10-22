import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/utils";

const control =
  "w-full rounded-lg border bg-transparent px-4 text-base md:text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-60 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

function FieldShell({ id, label, error, hint, required, className, children }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-error-500" aria-hidden="true"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-theme-xs font-medium text-error-600 dark:text-error-400">
          {error}
        </p>
      ) : (
        hint && <p className="text-theme-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </div>
  );
}

type BaseProps = { label: string; error?: string; hint?: ReactNode; className?: string };

export function TextInput({ label, error, hint, className, id, ...props }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint} required={props.required} className={className}>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={cn(control, "h-11", error ? "border-error-500" : "border-gray-300 dark:border-gray-700")}
        {...props}
      />
    </FieldShell>
  );
}

export function TextAreaInput({ label, error, hint, className, id, ...props }: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint} required={props.required} className={className}>
      <textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(control, "min-h-28 py-2.5", error ? "border-error-500" : "border-gray-300 dark:border-gray-700")}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectInput({
  label,
  error,
  hint,
  className,
  id,
  options,
  placeholder,
  ...props
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[]; placeholder?: string }) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint} required={props.required} className={className}>
      <select
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(control, "h-11 pe-10", error ? "border-error-500" : "border-gray-300 dark:border-gray-700")}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="dark:bg-gray-900">
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** Controlled on/off switch (the template Switch is uncontrolled). */
export function Toggle({ label, checked, onChange, description, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string; disabled?: boolean }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3", disabled && "cursor-not-allowed opacity-60")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:ring-3 focus-visible:ring-brand-500/30 focus-visible:outline-hidden",
          checked ? "bg-brand-500" : "bg-gray-200 dark:bg-white/10",
        )}
      >
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow-theme-sm transition-transform", checked ? "start-5.5" : "start-0.5")} />
      </button>
      <span className="text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        {description && <span className="block text-theme-xs text-gray-500 dark:text-gray-400">{description}</span>}
      </span>
    </label>
  );
}

/** Form-level message. */
export function Notice({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg px-4 py-3 text-sm font-medium",
        tone === "error"
          ? "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400"
          : "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
      )}
    >
      {children}
    </p>
  );
}
