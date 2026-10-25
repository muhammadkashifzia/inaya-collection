import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { fakeBanner } from "@//__tests__/helpers";
import { WinterCollections } from "../WinterCollections";

describe("WinterCollections", () => {
  it("returns null when banners is empty", () => {
    const { container } = render(<WinterCollections banners={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders the hardcoded title", () => {
    render(<WinterCollections banners={[fakeBanner()]} />);
    expect(screen.getByRole("heading", { name: /Our Recent Winter Unstitched Collections/i })).toBeInTheDocument();
  });

  it("renders banner links", () => {
    render(<WinterCollections banners={[fakeBanner({ id: 1, title: "Khaddar", buttons: [{ label: "Shop", href: "/collections/khaddar" }] })]} />);
    // MobileSlider duplicates for mobile + desktop; use getAllByText to find link text
    const links = screen.getAllByText("Khaddar");
    expect(links.length).toBeGreaterThanOrEqual(1);
    const link = links[0].closest("a");
    expect(link).toHaveAttribute("href", "/collections/khaddar");
  });

  it("falls back to /collections/all when no buttons", () => {
    render(<WinterCollections banners={[fakeBanner({ id: 1, title: "Velvet", buttons: [] })]} />);
    const links = screen.getAllByText("Velvet");
    expect(links.length).toBeGreaterThanOrEqual(1);
    const link = links[0].closest("a");
    expect(link).toHaveAttribute("href", "/collections/all");
  });
});
