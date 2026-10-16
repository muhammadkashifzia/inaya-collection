"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/atoms";
import { useStore } from "@/lib/store";

interface Tab {
  label: string;
  href?: string;
  icon: IconName;
  action?: () => void;
  badge?: number;
}

export function MobileTabBar() {
  const pathname = usePathname();
  const { cart, openCart, user, wishlistIds } = useStore();
  const cartCount = cart?.itemCount ?? 0;
  const wishlistCount = wishlistIds.size;

  const tabs: Tab[] = [
    { label: "Home", href: "/", icon: "home" },
    { label: "Shop", href: "/collections/all", icon: "grid" },
    { label: "Wishlist", href: "/wishlist", icon: "heart", badge: wishlistCount },
    {
      label: "Account",
      href: user ? "/account" : "/account/login",
      icon: "user",
    },
    { label: "Cart", icon: "bag", action: openCart, badge: cartCount },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-white lg:hidden"
    >
      <div className="flex items-stretch">
        {tabs.map((tab) => {
          const isActive = tab.href ? pathname === tab.href : false;
          const shared = cn(
            "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium uppercase tracking-wider transition-colors",
            isActive ? "text-brand" : "text-muted",
          );

          if (tab.action) {
            return (
              <button
                key={tab.label}
                type="button"
                aria-label={tab.label}
                onClick={tab.action}
                className={shared}
              >
                <span className="relative">
                  <Icon name={tab.icon} size={20} />
                  {tab.badge != null && tab.badge > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand px-0.5 text-[9px] font-bold leading-none text-white">
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </span>
                  )}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          }

          return (
            <Link key={tab.label} href={tab.href!} className={shared}>
              <span className="relative">
                <Icon name={tab.icon} size={20} />
                {tab.badge != null && tab.badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand px-0.5 text-[9px] font-bold leading-none text-white">
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </span>
                )}
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
