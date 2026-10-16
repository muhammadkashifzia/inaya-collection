"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, IconButton } from "@/components/atoms";
import { useStore } from "@/lib/store";
import type { NavItem } from "@/lib/types";

interface HeaderProps {
  siteName: string;
  navigation: NavItem[];
}

export function Header({ siteName, navigation }: HeaderProps) {
  const pathname = usePathname();
  const { cart, openCart, wishlistIds, user } = useStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const cartCount = cart?.itemCount ?? 0;
  const wishlistCount = wishlistIds.size;

  /* Lock body scroll for mobile menu */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  /* Focus search on open */
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  /* Close menu on route change */
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    },
    [searchQuery],
  );

  /* Split site name for brand styling */
  const words = siteName.split(" ");
  const firstWord = words[0];
  const rest = words.slice(1).join(" ");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 md:h-16 md:px-6">
        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="p-1.5 lg:hidden"
        >
          <Icon name="menu" size={22} />
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-baseline gap-1 font-heading text-xl font-bold tracking-wide md:text-2xl">
          <span>{firstWord}</span>
          {rest && <span className="text-brand">{rest}</span>}
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="ml-8 hidden items-center gap-6 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium uppercase tracking-widest transition-colors hover:text-brand",
                pathname === item.href ? "text-brand" : "text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Search toggle */}
        <div className="relative hidden items-center sm:flex">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                ref={searchRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search…"
                aria-label="Search products"
                className="h-9 w-48 border-b border-ink bg-transparent px-1 text-sm outline-none transition-all focus:w-64"
              />
              <button type="button" aria-label="Close search" onClick={() => setSearchOpen(false)} className="p-1">
                <Icon name="close" size={18} />
              </button>
            </form>
          ) : (
            <IconButton icon="search" label="Open search" onClick={() => setSearchOpen(true)} />
          )}
        </div>

        {/* Icon buttons */}
        <div className="flex items-center gap-0.5">
          <Link href="/wishlist" aria-label="Wishlist" className="relative hidden items-center justify-center rounded-full p-2 text-ink transition-colors hover:bg-ink/5 sm:inline-flex">
            <Icon name="heart" size={22} />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>
          <Link href={user ? "/account" : "/account/login"} aria-label="Account" className="hidden items-center justify-center rounded-full p-2 text-ink transition-colors hover:bg-ink/5 sm:inline-flex">
            <Icon name="user" size={22} />
          </Link>
          <IconButton
            icon="bag"
            label="Cart"
            badge={cartCount}
            onClick={openCart}
          />
        </div>
      </div>

      {/* Mobile slide-in menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}
      <div
        role="dialog"
        aria-label="Mobile menu"
        aria-modal={menuOpen}
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-white shadow-xl transition-transform duration-300 lg:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-4">
          <span className="font-heading text-lg font-bold tracking-wide">{siteName}</span>
          <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="p-1">
            <Icon name="close" size={22} />
          </button>
        </div>

        {/* Mobile search */}
        <form onSubmit={handleSearch} className="border-b border-line px-4 py-3">
          <div className="flex items-center gap-2 border border-ink/20 px-3">
            <Icon name="search" size={16} className="text-muted" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="h-9 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </form>

        <nav className="flex-1 overflow-y-auto py-2" aria-label="Mobile navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "block px-5 py-3 text-sm font-medium uppercase tracking-widest transition-colors hover:bg-cream",
                pathname === item.href ? "text-brand" : "text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-line p-4">
          <div className="flex items-center gap-4">
            <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="text-sm hover:text-brand">
              Wishlist
            </Link>
            <Link
              href={user ? "/account" : "/account/login"}
              onClick={() => setMenuOpen(false)}
              className="text-sm hover:text-brand"
            >
              {user ? "Account" : "Sign In"}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
