import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import "@//__tests__/helpers";
import { fakeProduct } from "@//__tests__/helpers";
import { ProductRail } from "../ProductRail";

describe("ProductRail", () => {
  it("returns null when products is empty", () => {
    const { container } = render(<ProductRail title="Latest" products={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders the section title", () => {
    render(<ProductRail title="New Arrivals" products={[fakeProduct()]} />);
    expect(screen.getByRole("heading", { name: /New Arrivals/i })).toBeInTheDocument();
  });

  it("renders 'View all' link when href is provided", () => {
    render(<ProductRail title="Sale" products={[fakeProduct()]} href="/collections/sale" />);
    expect(screen.getByRole("link", { name: /View all/i })).toHaveAttribute("href", "/collections/sale");
  });

  it("does not render 'View all' link when href is not provided", () => {
    render(<ProductRail title="Featured" products={[fakeProduct()]} />);
    expect(screen.queryByRole("link", { name: /View all/i })).not.toBeInTheDocument();
  });
});
