"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
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

/** Password input with show/hide eye toggle. */
export function PasswordField({ label, error, hint, className, id, ...props }: FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const [show, setShow] = useState(false);
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-widest text-ink">
        {label}
        {props.required && <span aria-hidden="true" className="text-brand"> *</span>}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={show ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(inputClass, "border-line pe-10")}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute end-0 top-0 flex h-11 w-10 items-center justify-center text-muted transition-colors hover:text-ink"
          aria-label={show ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {show ? (
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          ) : (
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5 1.79 0 3.476-.46 4.94-1.266m1.524-1.073A10.451 10.451 0 0 0 22.066 12c-1.292-4.338-5.31-7.5-10.066-7.5-1.247 0-2.444.234-3.544.659M3 3l18 18" />
            </svg>
          )}
        </button>
      </div>
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
