import { cn } from "@/lib/utils";

const levelSizes = {
  1: "text-3xl md:text-5xl",
  2: "text-2xl md:text-3xl",
  3: "text-lg md:text-xl",
  4: "text-base",
} as const;

type Level = keyof typeof levelSizes;

interface HeadingProps {
  level: Level;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  align?: "left" | "center";
  className?: string;
  children: React.ReactNode;
}

export function Heading({
  level,
  as,
  align = "left",
  className,
  children,
}: HeadingProps) {
  const Tag = as ?? (`h${level}` as keyof React.JSX.IntrinsicElements);
  return (
    <Tag
      className={cn(
        "font-heading font-semibold tracking-wide text-ink",
        levelSizes[level],
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
