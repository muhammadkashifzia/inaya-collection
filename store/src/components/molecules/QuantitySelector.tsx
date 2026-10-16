"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/atoms";

interface QuantitySelectorProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label?: string;
  disabled?: boolean;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  label = "Quantity",
  disabled = false,
}: QuantitySelectorProps) {
  const id = useId();

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      className="inline-flex items-center border border-ink/20"
    >
      <span id={`${id}-label`} className="sr-only">
        {label}
      </span>
      <button
        type="button"
        aria-label={`Decrease ${label.toLowerCase()}`}
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cn(
          "flex h-9 w-9 items-center justify-center transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40",
        )}
      >
        <Icon name="minus" size={14} />
      </button>
      <output
        aria-live="polite"
        className="flex h-9 w-9 items-center justify-center text-sm font-semibold tabular-nums"
      >
        {value}
      </output>
      <button
        type="button"
        aria-label={`Increase ${label.toLowerCase()}`}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={cn(
          "flex h-9 w-9 items-center justify-center transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40",
        )}
      >
        <Icon name="plus" size={14} />
      </button>
    </div>
  );
}
