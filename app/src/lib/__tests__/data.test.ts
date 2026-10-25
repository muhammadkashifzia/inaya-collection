import { describe, it, expect } from "vitest";
import { productQueryString } from "@/lib/data";

/**
 * Only testing the pure `productQueryString` function from data.ts.
 * The async server functions (getSite, getHome, etc.) use "use cache"
 * and server-only imports that require a full Next.js runtime to test properly.
 */
describe("productQueryString", () => {
  it("returns empty string for empty query", () => {
    expect(productQueryString({})).toBe("");
  });

  it("includes category when not 'all'", () => {
    const qs = productQueryString({ category: "abayas" });
    expect(qs).toContain("category=abayas");
  });

  it("excludes category when set to 'all'", () => {
    const qs = productQueryString({ category: "all" });
    expect(qs).not.toContain("category");
  });

  it("includes search query", () => {
    const qs = productQueryString({ q: "black dress" });
    expect(qs).toContain("q=black+dress");
  });

  it("includes sort parameter", () => {
    const qs = productQueryString({ sort: "price_asc" });
    expect(qs).toContain("sort=price_asc");
  });

  it("includes page only when greater than 1", () => {
    expect(productQueryString({ page: 1 })).not.toContain("page");
    expect(productQueryString({ page: 3 })).toContain("page=3");
  });

  it("includes per_page", () => {
    const qs = productQueryString({ perPage: 48 });
    expect(qs).toContain("per_page=48");
  });

  it("includes price filters", () => {
    const qs = productQueryString({ minPrice: 500, maxPrice: 5000 });
    expect(qs).toContain("min_price=500");
    expect(qs).toContain("max_price=5000");
  });

  it("includes availability filter", () => {
    const qs = productQueryString({ availability: "in_stock" });
    expect(qs).toContain("availability=in_stock");
  });

  it("includes on_sale flag", () => {
    const qs = productQueryString({ onSale: true });
    expect(qs).toContain("on_sale=1");
  });

  it("does not include on_sale when false", () => {
    const qs = productQueryString({ onSale: false });
    expect(qs).not.toContain("on_sale");
  });

  it("includes pieces", () => {
    const qs = productQueryString({ pieces: 3 });
    expect(qs).toContain("pieces=3");
  });

  it("includes fabric array with brackets", () => {
    const qs = productQueryString({ fabric: ["cotton", "silk"] });
    expect(qs).toContain("fabric");
    expect(qs).toContain("cotton");
    expect(qs).toContain("silk");
  });

  it("builds a complete query string", () => {
    const qs = productQueryString({
      category: "winter",
      q: "coat",
      sort: "latest",
      page: 2,
      perPage: 24,
      minPrice: 1000,
      maxPrice: 10000,
    });
    expect(qs).toContain("category=winter");
    expect(qs).toContain("q=coat");
    expect(qs).toContain("sort=latest");
    expect(qs).toContain("page=2");
    expect(qs).toContain("per_page=24");
    expect(qs).toContain("min_price=1000");
    expect(qs).toContain("max_price=10000");
  });
});
