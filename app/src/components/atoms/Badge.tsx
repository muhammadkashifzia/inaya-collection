import type { ReactNode } from "react";
import { cn } from "@/lib/format";

type Tone = "sale" | "dark" | "muted" | "light";

const tones: Record<Tone, string> = {
  sale: "bg-brand text-white",
  dark: "bg-ink text-white",
  muted: "bg-muted text-white",
  light: "bg-white text-ink",
};

export function Badge({ tone = "sale", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider", tones[tone], className)}>
      {children}
    </span>
  );
}
