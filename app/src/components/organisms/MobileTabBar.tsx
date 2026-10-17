"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/atoms";
import { useStore } from "@/context/StoreProvider";
import { cn } from "@/lib/format";

const tabs: { label: string; href: string; icon: IconName }[] = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Shop", href: "/collections/all", icon: "grid" },
  { label: "Wishlist", href: "/wishlist", icon: "heart" },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const { count, openCart, user } = useStore();
  const allTabs = [...tabs, { label: "Account", href: user ? "/account" : "/account/login", icon: "user" as IconName }];
  const itemClass = "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold uppercase tracking-wider";

  return (
    <nav aria-label="Quick links" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white lg:hidden">
      <ul className="flex">
        {allTabs.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <li key={t.href} className="flex flex-1">
              <Link href={t.href} aria-current={active ? "page" : undefined} className={cn(itemClass, active ? "text-brand" : "text-ink")}>
                <Icon name={t.icon} size={20} />
                {t.label}
              </Link>
            </li>
          );
        })}
        <li className="flex flex-1">
          <button type="button" onClick={openCart} className={cn(itemClass, "relative text-ink")}>
            <Icon name="bag" size={20} />
            Cart
            {count > 0 && (
              <span className="absolute right-[calc(50%-18px)] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] text-white">
                {count}
              </span>
            )}
          </button>
        </li>
      </ul>
    </nav>
  );
}
