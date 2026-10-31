import type { ReactNode } from "react";
import { Heading } from "@/components/atoms";

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <Heading level={2}>
            {title}
          </Heading>
          {subtitle && (
            <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-muted sm:text-[14px]">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <span className="mt-3 block h-px w-full bg-ink/10" aria-hidden="true" />
    </div>
  );
}
