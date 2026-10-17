import type { ReactNode } from "react";
import { cn } from "@/lib/format";

type Level = 1 | 2 | 3 | 4;

const styles: Record<Level, string> = {
  1: "text-3xl md:text-5xl",
  2: "text-2xl md:text-3xl",
  3: "text-lg md:text-xl",
  4: "text-base",
};

interface HeadingProps {
  level?: Level;
  as?: `h${Level}`;
  align?: "left" | "center";
  className?: string;
  children: ReactNode;
}

export function Heading({ level = 2, as, align = "left", className, children }: HeadingProps) {
  const Tag = as ?? (`h${level}` as const);
  return (
    <Tag
      className={cn(
        "font-heading font-semibold tracking-wide text-ink",
        styles[level],
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
