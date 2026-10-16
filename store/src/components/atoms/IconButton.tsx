"use client";

import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: IconName;
  label: string;
  filled?: boolean;
  badge?: number;
  size?: number;
  className?: string;
}

export function IconButton({
  icon,
  label,
  filled,
  badge,
  size = 22,
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full p-2 text-ink transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={size} filled={filled} />
      {badge != null && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}
