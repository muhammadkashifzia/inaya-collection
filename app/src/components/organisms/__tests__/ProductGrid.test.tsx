import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@//__tests__/helpers";
import { fakeProduct } from "@//__tests__/helpers";
import { ProductGrid, ProductGridSkeleton } from "../ProductGrid";

describe("ProductGrid", () => {
  it("shows empty text when no products", () => {
    render(<ProductGrid products={[]} />);
    expect(screen.getByText("No products found.")).toBeInTheDocument();
  });

  it("shows custom empty text", () => {
    render(<ProductGrid products={[]} emptyText="Coming soon!" />);
    expect(screen.getByText("Coming soon!")).toBeInTheDocument();
  });

  it("renders product cards as list items", () => {
    const products = [fakeProduct({ id: 1, slug: "p1" }), fakeProduct({ id: 2, slug: "p2" })];
    render(<ProductGrid products={products} />);
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBeGreaterThanOrEqual(2);
  });

  it("renders trailing content after products", () => {
    render(<ProductGrid products={[fakeProduct()]} trailing={<div>Discover More</div>} />);
    expect(screen.getByText("Discover More")).toBeInTheDocument();
  });
});

describe("ProductGridSkeleton", () => {
  it("renders default 4 skeleton items", () => {
    const { container } = render(<ProductGridSkeleton />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons).toHaveLength(4);
  });

  it("renders custom count", () => {
    const { container } = render(<ProductGridSkeleton count={8} />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons).toHaveLength(8);
  });

  it("is hidden from assistive tech", () => {
    render(<ProductGridSkeleton />);
    expect(screen.getByRole("list", { hidden: true })).toHaveAttribute("aria-hidden", "true");
  });
});
