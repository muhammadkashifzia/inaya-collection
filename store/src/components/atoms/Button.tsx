import Link from "next/link";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary: "bg-ink text-white hover:bg-ink/90",
  outline: "border border-ink text-ink hover:bg-ink hover:text-white",
  ghost: "text-ink hover:bg-ink/5",
  light: "bg-white text-ink hover:bg-cream",
} as const;

const sizes = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-sm",
} as const;

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

interface SharedProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

type ButtonProps = SharedProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof SharedProps>;

type ButtonLinkProps = SharedProps &
  Omit<React.ComponentProps<typeof Link>, keyof SharedProps>;

function classes(
  variant: Variant = "primary",
  size: Size = "md",
  fullWidth?: boolean,
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={classes(variant, size, fullWidth, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={classes(variant, size, fullWidth, className)} {...rest}>
      {children}
    </Link>
  );
}
