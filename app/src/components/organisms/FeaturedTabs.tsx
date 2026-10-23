"use client";

import { useState } from "react";
import { Container } from "@/components/atoms";
import { cn } from "@/lib/format";
import type { Collection, Product } from "@/types";
import { ProductGrid } from "./ProductGrid";

interface FeaturedTabsProps {
  title: string;
  description?: string;
  tabs: { category: Collection; total: number; products: Product[] }[];
}

/**
 * Split-header tabbed section: heading + description on the left,
 * category tabs on the right. Matches the "Best Sellers" design.
 */
export function FeaturedTabs({ title, description, tabs }: FeaturedTabsProps) {
  const [active, setActive] = useState(0);
  if (!tabs.length) return null;

  const current = tabs[active];

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = (index + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setActive(next);
    document.getElementById(`ftab-${tabs[next].category.slug}`)?.focus();
  }

  return (
    <section className="py-8 md:py-10">
      <Container>
        {/* Split header: title + desc left, tabs right */}
        <div className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-8">
          <div className="max-w-md">
            <h2 className="font-heading text-[clamp(1.6rem,2.6vw,2.25rem)] font-semibold leading-[1.15] tracking-[-0.01em] text-ink">
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                {description}
              </p>
            )}
          </div>

          <div
            role="tablist"
            aria-label={title}
            className="flex flex-wrap gap-x-5 gap-y-2 md:gap-x-7"
          >
            {tabs.map((t, i) => {
              const selected = i === active;
              return (
                <button
                  key={t.category.slug}
                  id={`ftab-${t.category.slug}`}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls="featured-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  className={cn(
                    "relative pb-1 text-[14px] font-medium tracking-[0.01em] transition-colors duration-200 md:text-[15px]",
                    selected
                      ? "text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-ink"
                      : "text-muted hover:text-ink",
                  )}
                >
                  {t.category.shortTitle}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product grid */}
        <div
          id="featured-panel"
          role="tabpanel"
          aria-labelledby={`ftab-${current.category.slug}`}
        >
          <ProductGrid
            products={current.products}
            emptyText="New designs are coming soon."
          />
        </div>
      </Container>
    </section>
  );
}
