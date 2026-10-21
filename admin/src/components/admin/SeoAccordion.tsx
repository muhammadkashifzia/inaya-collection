import { useState, type ReactNode } from "react";

export default function SeoAccordion({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-start"
      >
        <span className="text-base font-semibold text-gray-800 dark:text-white/90">Search engine listing</span>
        <svg
          className={`size-5 text-gray-500 transition-transform dark:text-gray-400 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-gray-200 px-5 py-5 dark:border-gray-800">
          {children}
        </div>
      )}
    </div>
  );
}
