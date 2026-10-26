"use client";

import { useState } from "react";
import { Container } from "@/components/atoms";
import { SectionHeader } from "@/components/molecules";
import type { Collection, Product } from "@/types";
import { ProductGrid } from "./ProductGrid";

interface FeaturedTabsProps {
  title: string;
  description?: string;
  tabs: { category: Collection; total: number; products: Product[] }[];
}

/**
 * Featured products section with category tabs on the right side of the heading.
 * "All" tab shows merged products from every collection; individual tabs filter.
 */
export function FeaturedTabs({ title, description, tabs }: FeaturedTabsProps) {
  const [activeTab, setActiveTab] = useState<number>(tabs[0].category.id);

  if (!tabs.length) return null;

  // Merge all tab products for the "All" view
  const seen = new Set<number>();
  const allProducts: Product[] = [];
  for (const tab of tabs) {
    for (const p of tab.products) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        allProducts.push(p);
      }
    }
  }

  if (!allProducts.length) return null;

  const displayProducts = tabs.find((t) => t.category.id === activeTab)?.products ?? allProducts;

  const categoryTabs = (
    <div role="tablist" className="flex items-center gap-4 md:gap-6 md:flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.category.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.category.id}
          onClick={() => setActiveTab(tab.category.id)}
          className={`shrink-0 pb-1 text-[13px] md:text-[14px] tracking-wide transition-colors ${
            activeTab === tab.category.id
              ? "border-b-2 border-ink font-semibold text-ink"
              : "text-muted hover:text-ink"
          }`}
        >
          {tab.category.shortTitle || tab.category.title}
        </button>
      ))}
    </div>
  );

  return (
    <section className="py-6 md:py-10">
      <Container>
        <SectionHeader title={title} subtitle={description} action={categoryTabs} />

        <ProductGrid
          products={displayProducts}
          emptyText="New designs are coming soon."
        />
      </Container>
    </section>
  );
}
