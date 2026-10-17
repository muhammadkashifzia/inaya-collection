"use client";

import { Icon } from "@/components/atoms";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  disabled?: boolean;
}

export function QuantitySelector({ value, onChange, min = 1, max = 10, label = "Quantity", disabled = false }: QuantitySelectorProps) {
  return (
    <div className="inline-flex h-10 items-center border border-line" role="group" aria-label={label}>
      <button
        type="button"
        className="flex h-full w-10 items-center justify-center hover:bg-cream disabled:opacity-40"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Icon name="minus" size={14} />
      </button>
      <output className="w-10 text-center text-sm font-semibold" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className="flex h-full w-10 items-center justify-center hover:bg-cream disabled:opacity-40"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Icon name="plus" size={14} />
      </button>
    </div>
  );
}
