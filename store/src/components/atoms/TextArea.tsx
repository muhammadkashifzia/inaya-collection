"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface TextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  label: string;
  error?: string;
  className?: string;
  id?: string;
}

export function TextArea({
  label,
  error,
  className,
  id: externalId,
  required,
  ...rest
}: TextAreaProps) {
  const autoId = useId();
  const id = externalId ?? autoId;
  const errorId = `${id}-error`;

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
      <textarea
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "min-h-[100px] w-full resize-y border bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-ink",
          error ? "border-red-500" : "border-ink/20",
        )}
        {...rest}
      />
      {error && (
        <p id={errorId} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
