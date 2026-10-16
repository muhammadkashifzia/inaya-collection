import type { ReactNode } from "react";
import { Link } from "react-router";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  back?: { to: string; label: string };
}

/** Page title row used at the top of every admin screen. */
export default function PageHeader({ title, description, actions, back }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && (
          <Link to={back.to} className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400">
            <span aria-hidden="true" className="rtl:rotate-180">←</span> {back.label}
          </Link>
        )}
        <h1 className="font-display text-title-sm font-semibold text-ink-900 dark:text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
