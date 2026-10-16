import type { ReactNode } from "react";
import type { ApiError } from "@/lib/api";
import Button from "@/components/ui/button/Button";

interface DataStateProps {
  loading: boolean;
  error: ApiError | null;
  empty?: boolean;
  emptyTitle?: string;
  emptyAction?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
  /** Keep showing stale children while reloading. */
  hasData?: boolean;
}

/** Loading / error / empty / success wrapper for API-driven screens. */
export default function DataState({ loading, error, empty, emptyTitle = "Nothing here yet.", emptyAction, onRetry, children, hasData }: DataStateProps) {
  if (error && !hasData) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-error-200 bg-error-50 px-6 py-10 text-center dark:border-error-500/30 dark:bg-error-500/10">
        <p className="text-sm font-medium text-error-700 dark:text-error-400">{error.message}</p>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  }
  if (loading && !hasData) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-white/5" />
        ))}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">{emptyTitle}</p>
        {emptyAction}
      </div>
    );
  }
  return <div className={loading ? "opacity-60 transition-opacity" : undefined}>{children}</div>;
}
