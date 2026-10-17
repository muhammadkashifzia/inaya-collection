import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/format";
import { Icon, type IconName } from "./Icon";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  label: string;
  filled?: boolean;
  badge?: number;
  size?: number;
}

export function IconButton({ icon, label, filled, badge, size, className, type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} filled={filled} size={size} />
      {!!badge && (
        <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
