import type { ReactNode } from "react";
import { Heading } from "@/components/atoms";

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col items-center gap-3 text-center">
      <Heading level={2} align="center" className="uppercase">
        {title}
      </Heading>
      <span className="h-0.5 w-14 bg-brand" aria-hidden="true" />
      {action}
    </div>
  );
}
