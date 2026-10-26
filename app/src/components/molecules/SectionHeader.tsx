import type { ReactNode } from "react";
import { Heading } from "@/components/atoms";

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="min-w-0">
          <Heading level={2}>
            {title}
          </Heading>
          {subtitle && (
            <p className="mt-1 max-w-md text-[13px] leading-relaxed text-muted md:mt-1.5 md:text-[14px]">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0 -mx-4 overflow-x-auto px-4 no-scrollbar md:mx-0 md:px-0 md:overflow-visible">{action}</div>}
      </div>
      <span className="mt-3 block h-px w-full bg-ink/10" aria-hidden="true" />
    </div>
  );
}
