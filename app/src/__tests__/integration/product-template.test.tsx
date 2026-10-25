/**
 * Integration test: ProductTemplate composes breadcrumb, ProductDetail,
 * ProductReviews, and related products grid.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "../helpers";
import { fakeProduct } from "../helpers";

import { ProductTemplate } from "@/components/templates/ProductTemplate";

describe("ProductTemplate integration", () => {
  const product = fakeProduct({
    title: "Black Silk Abaya",
    slug: "black-silk-abaya",
    categorySlug: "abayas",
    categoryName: "Abayas",
    price: 5500,
    description: "A premium silk abaya",
    details: ["Shirt", "Dupatta"],
    fabric: "Silk",
    pieces: 2,
    sku: "BSA-001",
  });

  it("renders breadcrumb with Home, category, and product title", () => {
    render(<ProductTemplate product={product} related={[]} maxQuantity={10} />);
    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(breadcrumb).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Abayas" })).toHaveAttribute("href", "/collections/abayas");
    // Title appears in breadcrumb + heading; just check breadcrumb has it
    const breadcrumbText = breadcrumb.textContent;
    expect(breadcrumbText).toContain("Black Silk Abaya");
  });

  it("renders product title in ProductDetail", () => {
    render(<ProductTemplate product={product} related={[]} maxQuantity={10} />);
    expect(screen.getByRole("heading", { name: "Black Silk Abaya" })).toBeInTheDocument();
  });

  it("renders product price", () => {
    render(<ProductTemplate product={product} related={[]} maxQuantity={10} />);
    // Price comes from variant (3500) or product price
    expect(screen.getByText("Rs.3,500.00")).toBeInTheDocument();
  });

  it("renders product description", () => {
    render(<ProductTemplate product={product} related={[]} maxQuantity={10} />);
    expect(screen.getByText("A premium silk abaya")).toBeInTheDocument();
  });

  it("renders product details list", () => {
    render(<ProductTemplate product={product} related={[]} maxQuantity={10} />);
    expect(screen.getByText("Shirt")).toBeInTheDocument();
    expect(screen.getByText("Dupatta")).toBeInTheDocument();
  });

  it("renders fabric and pieces info", () => {
    render(<ProductTemplate product={product} related={[]} maxQuantity={10} />);
    expect(screen.getByText("Silk")).toBeInTheDocument();
    expect(screen.getByText("2 Piece")).toBeInTheDocument();
  });

  it("renders Add to cart and Buy it now buttons", () => {
    render(<ProductTemplate product={product} related={[]} maxQuantity={10} />);
    expect(screen.getByRole("button", { name: /Add to cart/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Buy it now/i })).toBeInTheDocument();
  });

  it("renders 'You may also like' section when related products exist", () => {
    const related = [fakeProduct({ id: 2, slug: "related-1", title: "Related Product" })];
    render(<ProductTemplate product={product} related={related} maxQuantity={10} />);
    expect(screen.getByRole("heading", { name: /You may also like/i })).toBeInTheDocument();
    expect(screen.getByText("Related Product")).toBeInTheDocument();
  });

  it("does not render related section when no related products", () => {
    render(<ProductTemplate product={product} related={[]} maxQuantity={10} />);
    expect(screen.queryByText("You may also like")).not.toBeInTheDocument();
  });

  it("renders Customer reviews section", () => {
    render(<ProductTemplate product={product} related={[]} maxQuantity={10} />);
    expect(screen.getByRole("heading", { name: /Customer reviews/i })).toBeInTheDocument();
  });

  it("omits breadcrumb category link when categorySlug is null", () => {
    const noCategory = fakeProduct({ ...product, categorySlug: null, categoryName: null });
    render(<ProductTemplate product={noCategory} related={[]} maxQuantity={10} />);
    expect(screen.queryByRole("link", { name: "Abayas" })).not.toBeInTheDocument();
  });
});
