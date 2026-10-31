import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/format";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "light";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary: "bg-ink text-white hover:bg-ink/90",
  outline: "border border-ink text-ink hover:bg-ink hover:text-white",
  ghost: "text-ink hover:bg-ink/5",
  light: "bg-white text-ink hover:bg-cream",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-2.5 text-[11px] sm:h-9 sm:px-3 sm:text-xs",
  md: "h-10 px-4 text-[13px] sm:h-11 sm:px-5 sm:text-sm",
  lg: "h-11 px-5 text-[13px] sm:h-12 sm:px-7 sm:text-sm",
};

const base =
  "inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  type = "button",
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
}: CommonProps & { href: string }) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}>
      {children}
    </Link>
  );
}
