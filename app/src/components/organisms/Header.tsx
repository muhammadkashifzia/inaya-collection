"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Container, Icon, IconButton } from "@/components/atoms";
import { useStore } from "@/context/StoreProvider";
import { cn } from "@/lib/format";
import type { NavLink, SiteConfig } from "@/types";

/** Bundled logo used when "image" mode is selected but nothing has been uploaded. */
const DEFAULT_LOGO = "/anaya-collection-logo.svg";

const noopSubscribe = () => () => {};

/**
 * False on the server and during hydration, true afterwards. The header hydrates inside a
 * Suspense boundary, often after StoreProvider has already loaded the user, wishlist and cart,
 * so those values must not be used until hydration has finished.
 */
function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

interface HeaderProps {
  siteName: string;
  logoType: SiteConfig["logoType"];
  logoUrl: string | null;
  navigation: NavLink[];
}

export function Header({ siteName, logoType, logoUrl, navigation }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const store = useStore();
  const hydrated = useHydrated();
  // Match the server-rendered (guest, empty) markup until hydration is done.
  const user = hydrated ? store.user : null;
  const count = hydrated ? store.count : 0;
  const wishlist = hydrated ? store.wishlist : [];
  const { openCart } = store;
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <Container className="flex h-16 items-center justify-between gap-4 md:h-20">
        <div className="flex items-center gap-1 xl:hidden">
          <IconButton icon="menu" label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)} />
          <IconButton icon="search" label="Search" onClick={() => setSearchOpen((v) => !v)} />
        </div>

        {logoType === "text" ? (
          <Link href="/" className="shrink-0 whitespace-nowrap font-heading text-2xl font-bold uppercase tracking-[0.2em] text-ink md:text-3xl">
            {siteName.split(" ")[0]}
            <span className="text-brand">{siteName.split(" ").slice(1).join(" ")}</span>
          </Link>
        ) : (
          <Link href="/" aria-label={`${siteName} home`} className="shrink-0">
            {/* Served as-is: logos are small, and the default is an SVG. width/height only reserve
                space; CSS height + w-auto keeps the real aspect ratio of any uploaded file. */}
            <Image
              src={logoUrl ?? DEFAULT_LOGO}
              alt={siteName}
              width={850}
              height={375}
              priority
              unoptimized
              className="h-12 w-auto max-w-[45vw] object-contain md:h-16 md:max-w-60"
            />
          </Link>
        )}

        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-5 2xl:gap-7">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap text-xs font-semibold uppercase tracking-widest hover:text-brand",
                    pathname === item.href ? "text-brand" : "text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <IconButton className="hidden xl:inline-flex" icon="search" label="Search" onClick={() => setSearchOpen((v) => !v)} />
          <Link
            href="/wishlist"
            aria-label={`Wishlist, ${wishlist.length} items`}
            className="relative hidden h-10 w-10 items-center justify-center hover:text-brand md:inline-flex"
          >
            <Icon name="heart" />
            {wishlist.length > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                {wishlist.length}
              </span>
            )}
          </Link>
          <Link
            href={user ? "/account" : "/account/login"}
            aria-label={user ? `My account (${user.name})` : "Sign in"}
            className="hidden h-10 w-10 items-center justify-center hover:text-brand md:inline-flex"
          >
            <Icon name="user" />
          </Link>
          <IconButton icon="bag" label={`Open cart, ${count} items`} badge={count} onClick={openCart} />
        </div>
      </Container>

      {searchOpen && (
        <div className="border-t border-line bg-white">
          <Container className="py-3">
            <form role="search" onSubmit={onSearch} className="flex gap-2">
              <label htmlFor="site-search" className="sr-only">
                Search products
              </label>
              <input
                id="site-search"
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search khaddar, karandi, colours…"
                maxLength={100}
                className="h-11 flex-1 border border-line px-4 text-sm outline-none focus:border-ink"
              />
              <button type="submit" className="h-11 bg-ink px-5 text-xs font-semibold uppercase tracking-widest text-white">
                Search
              </button>
            </form>
          </Container>
        </div>
      )}

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-50 xl:hidden", menuOpen ? "visible" : "invisible")} aria-hidden={!menuOpen}>
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={menuOpen ? 0 : -1}
          onClick={close}
          className={cn("absolute inset-0 bg-black/50 transition-opacity", menuOpen ? "opacity-100" : "opacity-0")}
        />
        <nav
          aria-label="Mobile"
          className={cn(
            "absolute inset-y-0 left-0 flex w-80 max-w-[85%] flex-col bg-white transition-transform",
            menuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-heading text-lg font-semibold">Menu</span>
            <IconButton icon="close" label="Close menu" tabIndex={menuOpen ? 0 : -1} onClick={close} />
          </div>
          <ul className="flex-1 overflow-y-auto">
            {navigation.map((item) => (
              <li key={item.href} className="border-b border-line">
                <Link
                  href={item.href}
                  onClick={close}
                  tabIndex={menuOpen ? 0 : -1}
                  className="block px-5 py-4 text-sm font-semibold uppercase tracking-widest hover:text-brand"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
