"use client";

import { useId, useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/format";

interface SearchableSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * A select-like dropdown with a built-in search field.
 * Matches the visual style of SelectField but allows filtering options by typing.
 */
export function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Select…",
  error,
  hint,
  className,
  disabled,
  required,
}: SearchableSelectProps) {
  const autoId = useId();
  const errorId = `${autoId}-error`;
  const listboxId = `${autoId}-listbox`;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      setSearch("");
      setHighlightIndex(-1);
      // Small delay to let the dropdown render
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return;
    const el = listRef.current.children[highlightIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex]);

  const select = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
      setSearch("");
    },
    [onChange],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && filtered[highlightIndex]) {
          select(filtered[highlightIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  }

  // Reset highlight when search changes
  useEffect(() => {
    setHighlightIndex(filtered.length > 0 ? 0 : -1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const inputClass =
    "h-11 w-full border bg-white px-3 text-sm outline-none transition-colors focus:border-ink aria-[invalid=true]:border-error";

  return (
    <div className={cn("flex flex-col gap-1.5", className)} ref={containerRef}>
      <label className="text-xs font-semibold uppercase tracking-widest text-ink">
        {label}
        {required && <span aria-hidden="true" className="text-error"> *</span>}
      </label>

      {/* Trigger button styled like a select */}
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          inputClass,
          "border-line appearance-none text-left bg-[length:16px] bg-[right_12px_center] bg-no-repeat",
          "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.22%208.22a.75.75%200%20011.06%200L10%2011.94l3.72-3.72a.75.75%200%20111.06%201.06l-4.25%204.25a.75.75%200%2001-1.06%200L5.22%209.28a.75.75%200%20010-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]",
          disabled && "cursor-not-allowed opacity-50",
          !value && "text-muted",
        )}
      >
        {value || placeholder}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="relative z-50">
          <div
            className="absolute left-0 right-0 top-0 flex flex-col overflow-hidden border border-line bg-white shadow-lg"
            style={{ maxHeight: "260px" }}
          >
            {/* Search input */}
            <div className="shrink-0 border-b border-line p-2">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search…"
                className="h-9 w-full border border-line bg-white px-3 text-sm outline-none focus:border-ink"
                aria-label={`Search ${label}`}
                autoComplete="off"
              />
            </div>

            {/* Options list */}
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              className="flex-1 overflow-y-auto overscroll-contain"
            >
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted">No results found</li>
              )}
              {filtered.map((option, idx) => (
                <li
                  key={option}
                  role="option"
                  aria-selected={option === value}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm transition-colors",
                    idx === highlightIndex && "bg-cream",
                    option === value && "font-semibold",
                  )}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent blur on search input
                    select(option);
                  }}
                >
                  {option}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p id={errorId} className="text-xs font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
}
