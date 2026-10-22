"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Container, Heading } from "@/components/atoms";
import { useStore } from "@/context/StoreProvider";
import { cn } from "@/lib/format";

const LINKS = [
  { href: "/account", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/wishlist", label: "Wishlist" },
];

/**
 * Client-side guard for account pages. The API independently rejects
 * unauthenticated requests (401), so this only controls navigation.
 */
export function AccountShell({ title, children }: { title: string; children: ReactNode }) {
  const { user, authReady, signOut } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authReady && !user) router.replace(`/account/login?next=${encodeURIComponent(pathname)}`);
  }, [authReady, user, router, pathname]);

  if (!authReady || !user) {
    return <Container className="py-16 text-center text-muted">Loading your account…</Container>;
  }

  return (
    <Container className="py-10 md:py-14">
      <Heading level={1} className="mb-2">{title}</Heading>
      <p className="mb-8 text-sm text-muted">Signed in as {user.email}</p>
      <div className="grid gap-10 md:grid-cols-[200px_1fr]">
        <nav aria-label="Account">
          <ul className="flex gap-1 overflow-x-auto border-b border-line pb-px md:flex-col md:gap-0 md:overflow-visible md:border-b-0 md:pb-0">
            {LINKS.map((l) => {
              const active = l.href === "/account" ? pathname === "/account" : pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link href={l.href} aria-current={active ? "page" : undefined}
                    className={cn(
                      "block whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-widest transition-colors",
                      "border-b-2 md:border-b-0 md:border-l-2",
                      active
                        ? "border-brand text-brand"
                        : "border-transparent text-muted hover:text-brand",
                    )}>
                    {l.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  router.replace("/");
                }}
                className={cn(
                  "block whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-widest text-muted transition-colors hover:text-brand",
                  "border-b-2 md:border-b-0 md:border-l-2 border-transparent",
                )}
              >
                Sign out
              </button>
            </li>
          </ul>
        </nav>
        <div>{children}</div>
      </div>
    </Container>
  );
}
