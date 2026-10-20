import { useEffect, useState, type ReactNode } from "react";
import { SearchIcon } from "@/icons";

/** Search box (debounced) plus optional filter controls. */
export default function FilterBar({ search, onSearch, placeholder = "Search…", children }: { search: string; onSearch: (q: string) => void; placeholder?: string; children?: ReactNode }) {
  const [value, setValue] = useState(search);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (value !== search) onSearch(value.trim());
    }, 350);
    return () => window.clearTimeout(id);
  }, [value, search, onSearch]);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <label className="relative min-w-64 flex-1">
        <span className="sr-only">{placeholder}</span>
        <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          maxLength={100}
          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent ps-10 pe-4 text-sm shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
        />
      </label>
      {children}
    </div>
  );
}

const selectClass =
  "h-11 rounded-lg border border-gray-300 bg-transparent px-3 pe-10 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass} aria-label={label}>
        <option value="">{label}: All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
