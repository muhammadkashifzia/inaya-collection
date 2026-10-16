"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  id?: string;
}

export function Input({
  label,
  error,
  hint,
  className,
  id: externalId,
  required,
  ...rest
}: InputProps) {
  const autoId = useId();
  const id = externalId ?? autoId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className="text-[11px] font-semibold uppercase tracking-widest text-ink/70"
      >
        {label}
        {required && (
          <span className="ml-0.5 text-brand" aria-hidden>
            *
          </span>
        )}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [error && errorId, hint && hintId].filter(Boolean).join(" ") ||
          undefined
        }
        className={cn(
          "h-11 w-full border bg-white px-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-ink",
          error ? "border-red-500" : "border-ink/20",
        )}
        {...rest}
      />
      {error && (
        <p id={errorId} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
