import { cn } from "@/lib/utils";

const tones = {
  sale: "bg-brand text-white",
  dark: "bg-ink text-white",
  muted: "bg-muted text-white",
  light: "bg-white text-ink",
} as const;

export function Badge({
  tone = "sale",
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
