import type { ReactNode } from "react";
import { cn } from "@/utils";

interface ButtonProps {
  children: ReactNode;
  size?: "sm" | "md";
  variant?: "primary" | "outline" | "dark" | "danger" | "ghost";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
  className?: string;
  title?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  loading = false,
  type = "button",
  title,
}) => {
  const sizeClasses = {
    sm: "px-3.5 py-2 text-sm",
    md: "px-5 py-3 text-sm",
  };

  const variantClasses = {
    primary: "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
    dark: "bg-ink-900 text-white shadow-theme-xs hover:bg-ink-800 dark:bg-white/10 dark:hover:bg-white/15",
    danger: "bg-white text-error-600 ring-1 ring-inset ring-error-200 hover:bg-error-50 dark:bg-gray-800 dark:text-error-400 dark:ring-error-500/30 dark:hover:bg-error-500/10",
    ghost: "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5",
    outline:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/3 dark:hover:text-gray-300",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      title={title}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:ring-3 focus-visible:ring-brand-500/30 focus-visible:outline-hidden",
        sizeClasses[size],
        variantClasses[variant],
        isDisabled && "cursor-not-allowed opacity-50",
        className,
      )}
      onClick={onClick}
      disabled={isDisabled}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-e-transparent" aria-hidden="true" />
      ) : (
        startIcon && <span className="flex items-center">{startIcon}</span>
      )}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
