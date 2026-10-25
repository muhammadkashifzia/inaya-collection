/**
 * Integration test: CollectionTemplate composes breadcrumb, CatalogToolbar,
 * ProductGrid, and Pagination working together.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "../helpers";
import { fakeProduct } from "../helpers";

import { CollectionTemplate } from "@/components/templates/CollectionTemplate";
import type { Facets, Paginated, Product } from "@/types";

const facets: Facets = { fabrics: ["Cotton", "Silk"], pieces: [2, 3], brands: [], price: { min: 500, max: 15000 } };

function fakeResult(products: Product[], page = 1, total = 24): Paginated<Product> {
  return { data: products, meta: { currentPage: page, lastPage: Math.ceil(total / 24), perPage: 24, total } };
}

describe("CollectionTemplate integration", () => {
  it("renders collection title and breadcrumb", () => {
    const products = [fakeProduct({ id: 1, slug: "p1" })];
    render(<CollectionTemplate title="Winter Collection" basePath="/collections/winter" query="" result={fakeResult(products, 1, 1)} facets={facets} />);
    expect(screen.getByRole("heading", { name: "Winter Collection" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it("renders description when provided", () => {
    render(<CollectionTemplate title="T" description="Browse our winter range" basePath="/c/w" query="" result={fakeResult([fakeProduct()])} facets={facets} />);
    expect(screen.getByText("Browse our winter range")).toBeInTheDocument();
  });

  it("does not render description when null", () => {
    render(<CollectionTemplate title="T" description={null} basePath="/c" query="" result={fakeResult([fakeProduct()])} facets={facets} />);
    expect(screen.queryByText("Browse")).not.toBeInTheDocument();
  });

  it("renders product count in CatalogToolbar", () => {
    render(<CollectionTemplate title="T" basePath="/c" query="" result={fakeResult([fakeProduct()], 1, 48)} facets={facets} />);
    expect(screen.getByText("48 products")).toBeInTheDocument();
  });

  it("renders products in the grid", () => {
    const products = [
      fakeProduct({ id: 1, slug: "p1", title: "Product A" }),
      fakeProduct({ id: 2, slug: "p2", title: "Product B" }),
    ];
    render(<CollectionTemplate title="T" basePath="/c" query="" result={fakeResult(products, 1, 2)} facets={facets} />);
    expect(screen.getByText("Product A")).toBeInTheDocument();
    expect(screen.getByText("Product B")).toBeInTheDocument();
  });

  it("shows empty text when no products match", () => {
    render(<CollectionTemplate title="T" basePath="/c" query="" result={fakeResult([], 1, 0)} facets={facets} />);
    expect(screen.getByText("No products match these filters.")).toBeInTheDocument();
  });

  it("renders pagination when multiple pages", () => {
    render(<CollectionTemplate title="T" basePath="/collections/all" query="" result={fakeResult([fakeProduct()], 1, 72)} facets={facets} />);
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
  });

  it("does not render pagination on single page", () => {
    render(<CollectionTemplate title="T" basePath="/c" query="" result={fakeResult([fakeProduct()], 1, 1)} facets={facets} />);
    expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
  });

  it("renders sort dropdown in CatalogToolbar", () => {
    render(<CollectionTemplate title="T" basePath="/c" query="" result={fakeResult([fakeProduct()])} facets={facets} />);
    expect(screen.getByText("Sort by")).toBeInTheDocument();
  });

  it("renders Filter button with facets", () => {
    render(<CollectionTemplate title="T" basePath="/c" query="" result={fakeResult([fakeProduct()])} facets={facets} />);
    expect(screen.getByRole("button", { name: /Filter/i })).toBeInTheDocument();
  });
});
