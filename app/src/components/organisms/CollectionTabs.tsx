"use client";

import { useState, useTransition } from "react";
import { ButtonLink, Container } from "@/components/atoms";
import { cn } from "@/lib/format";
import { api } from "@/lib/api";
import type { Collection, Product } from "@/types";
import { ProductGrid } from "./ProductGrid";

interface CollectionTabsProps {
  title: string;
  tabs: { category: Collection; total: number; products: Product[] }[];
}

/**
 * Tabbed product rail with "View more" inline loading.
 * Initial products come from GET /api/v1/home (server-rendered),
 * additional products are fetched client-side on demand.
 */
export function CollectionTabs({ title, tabs }: CollectionTabsProps) {
  const [active, setActive] = useState(0);
  const [extraProducts, setExtraProducts] = useState<Record<number, Product[]>>({});
  const [loadedAll, setLoadedAll] = useState<Record<number, boolean>>({});
  const [page, setPage] = useState<Record<number, number>>({});
  const [isPending, startTransition] = useTransition();

  if (!tabs.length) return null;

  const current = tabs[active];
  const allProducts = [...current.products, ...(extraProducts[active] ?? [])];
  const hasMore = !loadedAll[active] && current.total > allProducts.length;

  function handleTabChange(index: number) {
    setActive(index);
  }

  function loadMore() {
    const nextPage = (page[active] ?? 1) + 1;
    startTransition(async () => {
      try {
        const result = await api.products({
          category: current.category.slug,
          page: nextPage,
          perPage: 8,
          sort: "latest",
        });

        // Deduplicate by id against existing products
        const existingIds = new Set(allProducts.map((p) => p.id));
        const newProducts = result.data.filter((p) => !existingIds.has(p.id));

        setExtraProducts((prev) => ({
          ...prev,
          [active]: [...(prev[active] ?? []), ...newProducts],
        }));
        setPage((prev) => ({ ...prev, [active]: nextPage }));

        if (nextPage >= result.meta.lastPage) {
          setLoadedAll((prev) => ({ ...prev, [active]: true }));
        }
      } catch {
        // silently handled
      }
    });
  }

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = (index + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    handleTabChange(next);
    document.getElementById(`tab-${tabs[next].category.slug}`)?.focus();
  }

  return (
    <section className="py-8 md:py-10">
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
                onClick={() => handleTabChange(i)}
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
          <ProductGrid products={allProducts} emptyText="New designs are coming soon." />

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={isPending}
                className="inline-flex items-center gap-2 border border-[#111] bg-transparent px-8 py-3 text-[13px] font-semibold uppercase tracking-[0.1em] text-[#111] transition-colors hover:bg-[#111] hover:text-white disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-e-transparent" aria-hidden="true" />
                    Loading...
                  </>
                ) : (
                  "View More"
                )}
              </button>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
