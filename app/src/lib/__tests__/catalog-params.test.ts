import { describe, it, expect } from "vitest";
import { parseCatalogParams } from "@/lib/catalog-params";

describe("parseCatalogParams", () => {
  /* ---- defaults ---- */
  it("returns defaults when no params are provided", () => {
    const { query, queryString } = parseCatalogParams({});
    expect(query.sort).toBe("featured");
    expect(query.page).toBe(1);
    expect(query.perPage).toBe(24);
    expect(query.category).toBeUndefined();
    expect(query.q).toBeUndefined();
    expect(queryString).toBe("");
  });

  it("passes through the category argument", () => {
    const { query } = parseCatalogParams({}, "winter-collection");
    expect(query.category).toBe("winter-collection");
  });

  /* ---- sort ---- */
  it("accepts valid sort options", () => {
    expect(parseCatalogParams({ sort: "latest" }).query.sort).toBe("latest");
    expect(parseCatalogParams({ sort: "price_asc" }).query.sort).toBe("price_asc");
    expect(parseCatalogParams({ sort: "price_desc" }).query.sort).toBe("price_desc");
    expect(parseCatalogParams({ sort: "popularity" }).query.sort).toBe("popularity");
    expect(parseCatalogParams({ sort: "name" }).query.sort).toBe("name");
  });

  it("defaults invalid sort to featured", () => {
    expect(parseCatalogParams({ sort: "invalid_sort" }).query.sort).toBe("featured");
  });

  it("puts non-default sort in queryString", () => {
    const { queryString } = parseCatalogParams({ sort: "latest" });
    expect(queryString).toContain("sort=latest");
  });

  it("omits featured sort from queryString", () => {
    const { queryString } = parseCatalogParams({ sort: "featured" });
    expect(queryString).not.toContain("sort");
  });

  /* ---- page ---- */
  it("parses page number", () => {
    expect(parseCatalogParams({ page: "3" }).query.page).toBe(3);
  });

  it("clamps negative page to 1", () => {
    expect(parseCatalogParams({ page: "-5" }).query.page).toBe(1);
  });

  it("clamps zero page to 1", () => {
    expect(parseCatalogParams({ page: "0" }).query.page).toBe(1);
  });

  it("floors decimal page numbers", () => {
    expect(parseCatalogParams({ page: "2.7" }).query.page).toBe(2);
  });

  it("defaults non-numeric page to 1", () => {
    expect(parseCatalogParams({ page: "abc" }).query.page).toBe(1);
  });

  /* ---- price filters ---- */
  it("parses min and max price", () => {
    const { query } = parseCatalogParams({ min_price: "500", max_price: "2000" });
    expect(query.minPrice).toBe(500);
    expect(query.maxPrice).toBe(2000);
  });

  it("puts price filters in queryString", () => {
    const { queryString } = parseCatalogParams({ min_price: "100", max_price: "5000" });
    expect(queryString).toContain("min_price=100");
    expect(queryString).toContain("max_price=5000");
  });

  it("ignores negative prices", () => {
    const { query } = parseCatalogParams({ min_price: "-100" });
    expect(query.minPrice).toBeUndefined();
  });

  it("ignores non-numeric prices", () => {
    const { query } = parseCatalogParams({ min_price: "abc" });
    expect(query.minPrice).toBeUndefined();
  });

  /* ---- availability ---- */
  it("accepts in_stock availability", () => {
    expect(parseCatalogParams({ availability: "in_stock" }).query.availability).toBe("in_stock");
  });

  it("accepts out_of_stock availability", () => {
    expect(parseCatalogParams({ availability: "out_of_stock" }).query.availability).toBe("out_of_stock");
  });

  it("rejects invalid availability", () => {
    expect(parseCatalogParams({ availability: "bogus" }).query.availability).toBeUndefined();
  });

  /* ---- onSale ---- */
  it("sets onSale true when on_sale is '1'", () => {
    expect(parseCatalogParams({ on_sale: "1" }).query.onSale).toBe(true);
  });

  it("does not set onSale for other values", () => {
    expect(parseCatalogParams({ on_sale: "0" }).query.onSale).toBeUndefined();
    expect(parseCatalogParams({ on_sale: "yes" }).query.onSale).toBeUndefined();
  });

  /* ---- pieces ---- */
  it("parses pieces as a number", () => {
    expect(parseCatalogParams({ pieces: "3" }).query.pieces).toBe(3);
  });

  it("ignores zero pieces", () => {
    expect(parseCatalogParams({ pieces: "0" }).query.pieces).toBeUndefined();
  });

  /* ---- fabric ---- */
  it("handles single fabric string", () => {
    const { query } = parseCatalogParams({ fabric: "cotton" });
    expect(query.fabric).toEqual(["cotton"]);
  });

  it("handles fabric array", () => {
    const { query } = parseCatalogParams({ fabric: ["cotton", "silk"] });
    expect(query.fabric).toEqual(["cotton", "silk"]);
  });

  it("limits fabric to 10 items", () => {
    const fabrics = Array.from({ length: 15 }, (_, i) => `fabric-${i}`);
    const { query } = parseCatalogParams({ fabric: fabrics });
    expect(query.fabric).toHaveLength(10);
  });

  it("truncates each fabric value to 60 chars", () => {
    const longFabric = "a".repeat(100);
    const { query } = parseCatalogParams({ fabric: longFabric });
    expect(query.fabric![0]).toHaveLength(60);
  });

  it("appends fabric values to queryString", () => {
    const { queryString } = parseCatalogParams({ fabric: ["cotton", "silk"] });
    expect(queryString).toContain("fabric=cotton");
    expect(queryString).toContain("fabric=silk");
  });

  /* ---- search query (q) ---- */
  it("parses search query", () => {
    expect(parseCatalogParams({ q: "dress" }).query.q).toBe("dress");
  });

  it("truncates query to 100 chars", () => {
    const long = "x".repeat(200);
    expect(parseCatalogParams({ q: long }).query.q).toHaveLength(100);
  });

  it("treats empty q as undefined", () => {
    expect(parseCatalogParams({ q: "" }).query.q).toBeUndefined();
  });

  /* ---- array param handling ---- */
  it("handles sort as an array (takes first)", () => {
    const { query } = parseCatalogParams({ sort: ["latest", "name"] });
    expect(query.sort).toBe("latest");
  });
});
