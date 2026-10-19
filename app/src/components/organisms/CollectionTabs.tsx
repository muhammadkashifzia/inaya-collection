"use client";

import { useState } from "react";
import { Container } from "@/components/atoms";
import { DiscoverMoreTile } from "@/components/molecules";
import { cn } from "@/lib/format";
import type { Collection, Product } from "@/types";
import { ProductGrid } from "./ProductGrid";

interface CollectionTabsProps {
  title: string;
  tabs: { category: Collection; total: number; products: Product[] }[];
}

/**
 * Tabbed product rail: N product cards + a blurred "Discover more" tile.
 * All tabs come from GET /api/v1/home (server-rendered), so switching is instant.
 */
export function CollectionTabs({ title, tabs }: CollectionTabsProps) {
  const [active, setActive] = useState(0);
  if (!tabs.length) return null;

  const current = tabs[active];
  const remaining = Math.max(0, current.total - current.products.length);

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = (index + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setActive(next);
    document.getElementById(`tab-${tabs[next].category.slug}`)?.focus();
  }

  return (
    <section className="py-14 md:py-15">
      <Container>
        <h2 className="mb-[18px] text-center text-[clamp(1.45rem,2.2vw,2rem)] font-medium leading-tight tracking-[-0.02em] text-[#111]">
          {title}
        </h2>

        <div role="tablist" aria-label="Collections" className="mb-[22px] flex flex-wrap justify-center gap-x-[22px] gap-y-2 border-b border-[#ececec]">
          {tabs.map((t, i) => {
            const selected = i === active;
            return (
              <button
                key={t.category.slug}
                id={`tab-${t.category.slug}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls="collection-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={cn(
                  "-mb-px border-b-2 px-0.5 pb-2.5 pt-3 text-xs uppercase leading-tight tracking-[0.12em] md:text-[13px] md:tracking-[0.14em]",
                  selected
                    ? "border-[#111] font-semibold text-[#111]"
                    : "border-transparent font-medium text-[#8d8d8d] hover:text-[#111] focus-visible:text-[#111]",
                )}
              >
                {t.category.shortTitle}
              </button>
            );
          })}
        </div>

        <div id="collection-panel" role="tabpanel" aria-labelledby={`tab-${current.category.slug}`}>
          <ProductGrid
            products={current.products}
            emptyText="New designs are coming soon."
            trailing={
              <DiscoverMoreTile
                href={`/collections/${current.category.slug}`}
                image={current.products.at(-1)?.images[1] ?? current.category.image}
                remaining={remaining}
              />
            }
          />
        </div>
      </Container>
    </section>
  );
}
