import type { ReactNode } from "react";
import { Heading } from "@/components/atoms";
import { cn } from "@/lib/format";

export function SectionHeader({ title, subtitle, action, center = true }: { title: string; subtitle?: string; action?: ReactNode; center?: boolean }) {
  return (
    <div className="mb-6 md:mb-8">
      <div className={cn(
        "flex flex-col gap-3",
        center
          ? "items-center text-center"
          : "md:flex-row md:items-end md:justify-between md:gap-6",
      )}>
        <div className={cn("min-w-0", center && "flex flex-col items-center")}>
          <Heading level={2} align={center ? "center" : "left"}>
            {title}
          </Heading>
          {subtitle && (
            <p className={cn(
              "mt-1 max-w-md text-[13px] leading-relaxed text-muted md:mt-1.5 md:text-[14px]",
              center && "mx-auto",
            )}>{subtitle}</p>
          )}
        </div>
        {action && (
          <div className={cn(
            "shrink-0",
            center
              ? "-mx-4 overflow-x-auto px-4 no-scrollbar md:mx-0 md:px-0 md:overflow-visible"
              : "-mx-4 overflow-x-auto px-4 no-scrollbar md:mx-0 md:px-0 md:overflow-visible",
          )}>{action}</div>
        )}
      </div>
      <span className="mt-3 block h-px w-full bg-ink/10" aria-hidden="true" />
    </div>
  );
}
