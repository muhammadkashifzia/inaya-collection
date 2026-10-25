import type { ReactNode } from "react";
import { Heading } from "@/components/atoms";

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-end justify-between gap-6">
        <div className="shrink-0">
          <Heading level={2}>
            {title}
          </Heading>
          {subtitle && (
            <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-muted">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <span className="mt-3 block h-px w-full bg-ink/10" aria-hidden="true" />
    </div>
  );
}
