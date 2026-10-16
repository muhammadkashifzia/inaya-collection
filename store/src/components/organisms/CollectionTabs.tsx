"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/atoms";
import { CollectionCard } from "@/components/molecules";
import { ProductGrid } from "./ProductGrid";
import { SectionTitle } from "./SectionTitle";
import type { Category, Product } from "@/lib/types";

interface Tab {
  category: Category;
  total: number;
  products: Product[];
}

interface CollectionTabsProps {
  title: string;
  tabs: Tab[];
}

export function CollectionTabs({ title, tabs }: CollectionTabsProps) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let next = active;
      if (e.key === "ArrowRight") next = (active + 1) % tabs.length;
      else if (e.key === "ArrowLeft") next = (active - 1 + tabs.length) % tabs.length;
      else return;
      e.preventDefault();
      setActive(next);
      tabRefs.current[next]?.focus();
    },
    [active, tabs.length],
  );

  if (tabs.length === 0) return null;

  const current = tabs[active];
  const remaining = current.total - current.products.length;

  return (
    <section>
      <Container>
        <SectionTitle title={title} />

        {/* Tab list */}
        <div
          role="tablist"
          aria-label={title}
          className="mb-8 flex flex-wrap justify-center gap-2"
          onKeyDown={onKeyDown}
        >
          {tabs.map((tab, i) => (
            <button
              key={tab.category.id}
              ref={(el) => { tabRefs.current[i] = el; }}
              role="tab"
              id={`tab-${tab.category.id}`}
              aria-selected={i === active}
              aria-controls={`panel-${tab.category.id}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={cn(
                "px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors",
                i === active
                  ? "border-b-2 border-brand text-brand"
                  : "text-muted hover:text-ink",
              )}
            >
              {tab.category.shortTitle || tab.category.title}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        {tabs.map((tab, i) => (
          <div
            key={tab.category.id}
            role="tabpanel"
            id={`panel-${tab.category.id}`}
            aria-labelledby={`tab-${tab.category.id}`}
            hidden={i !== active}
          >
            {i === active && (
              <ProductGrid
                products={tab.products}
                trailing={
                  remaining > 0 ? (
                    <CollectionCard
                      href={`/collections/${tab.category.slug}`}
                      image={tab.category.image}
                      remaining={remaining}
                    />
                  ) : undefined
                }
              />
            )}
          </div>
        ))}
      </Container>
    </section>
  );
}
