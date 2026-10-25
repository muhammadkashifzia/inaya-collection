import { describe, it, expect, beforeEach, vi } from "vitest";
import { siteUrl, productJsonLd, jsonLdString } from "@/lib/seo";
import type { Product, SiteConfig } from "@/types";

/* ---- helpers ---- */

function fakeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    slug: "black-abaya",
    sku: "BA-001",
    title: "Black Abaya",
    brand: "Inaya",
    categorySlug: "abayas",
    categoryName: "Abayas",
    price: 3500,
    compareAtPrice: null,
    discountPercent: 0,
    images: ["https://cdn.example.com/img1.jpg", "https://cdn.example.com/img2.jpg"],
    inStock: true,
    isAvailable: true,
    fabric: "Chiffon",
    pieces: 2,
    details: [],
    shortDescription: "A beautiful black abaya",
    description: "Full description here",
    variants: [],
    defaultVariantId: null,
    variantsCount: 0,
    metaTitle: null,
    metaDescription: "Meta desc for SEO",
    publishedAt: null,
    updatedAt: null,
    ...overrides,
  };
}

function fakeSite(overrides: Partial<SiteConfig> = {}): SiteConfig {
  return {
    name: "Inaya Collection",
    logoType: "text",
    logoUrl: null,
    tagline: "",
    about: "",
    email: null,
    phone: null,
    whatsapp: null,
    address: null,
    hours: null,
    currencySymbol: "Rs.",
    announcements: [],
    freeShippingThreshold: null,
    shippingMethods: [],
    paymentMethods: [],
    allowGuestCheckout: true,
    maxQuantityPerItem: 10,
    navigation: [],
    trust: [],
    footer: { columns: [], copyright: "", logoUrl: null },
    social: [],
    seo: { defaultTitle: "", defaultDescription: "", ogImage: null },
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  siteUrl                                                            */
/* ------------------------------------------------------------------ */
describe("siteUrl", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it("returns localhost when env is not set", () => {
    expect(siteUrl()).toBe("http://localhost:3000");
  });

  it("returns env value without trailing slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://inaya.pk/";
    expect(siteUrl()).toBe("https://inaya.pk");
  });

  it("returns env value as-is if no trailing slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://inaya.pk";
    expect(siteUrl()).toBe("https://inaya.pk");
  });
});

/* ------------------------------------------------------------------ */
/*  productJsonLd                                                      */
/* ------------------------------------------------------------------ */
describe("productJsonLd", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://inaya.pk";
  });

  it("generates correct schema.org structure", () => {
    const ld = productJsonLd(fakeProduct(), fakeSite());
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("Product");
    expect(ld.name).toBe("Black Abaya");
    expect(ld.sku).toBe("BA-001");
    expect(ld.url).toBe("https://inaya.pk/products/black-abaya");
  });

  it("uses metaDescription as description when available", () => {
    const ld = productJsonLd(fakeProduct({ metaDescription: "Meta desc for SEO" }), fakeSite());
    expect(ld.description).toBe("Meta desc for SEO");
  });

  it("falls back to shortDescription when metaDescription is null", () => {
    const ld = productJsonLd(fakeProduct({ metaDescription: null, shortDescription: "Short desc" }), fakeSite());
    expect(ld.description).toBe("Short desc");
  });

  it("falls back to description when both meta and short are null", () => {
    const ld = productJsonLd(fakeProduct({ metaDescription: null, shortDescription: null, description: "Full desc" }), fakeSite());
    expect(ld.description).toBe("Full desc");
  });

  it("sets description undefined when all are null", () => {
    const ld = productJsonLd(fakeProduct({ metaDescription: null, shortDescription: null, description: null }), fakeSite());
    expect(ld.description).toBeUndefined();
  });

  it("uses product brand when available", () => {
    const ld = productJsonLd(fakeProduct({ brand: "Inaya" }), fakeSite());
    expect(ld.brand).toEqual({ "@type": "Brand", name: "Inaya" });
  });

  it("falls back to site name for brand", () => {
    const ld = productJsonLd(fakeProduct({ brand: null }), fakeSite({ name: "Inaya Collection" }));
    expect(ld.brand).toEqual({ "@type": "Brand", name: "Inaya Collection" });
  });

  it("sets InStock availability when product is available", () => {
    const ld = productJsonLd(fakeProduct({ isAvailable: true }), fakeSite());
    const offers = ld.offers as Record<string, unknown>;
    expect(offers.availability).toBe("https://schema.org/InStock");
  });

  it("sets OutOfStock availability when product is unavailable", () => {
    const ld = productJsonLd(fakeProduct({ isAvailable: false }), fakeSite());
    const offers = ld.offers as Record<string, unknown>;
    expect(offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("formats price with two decimal places", () => {
    const ld = productJsonLd(fakeProduct({ price: 3500 }), fakeSite());
    const offers = ld.offers as Record<string, unknown>;
    expect(offers.price).toBe("3500.00");
    expect(offers.priceCurrency).toBe("PKR");
  });

  it("includes images array", () => {
    const images = ["https://cdn.example.com/img1.jpg"];
    const ld = productJsonLd(fakeProduct({ images }), fakeSite());
    expect(ld.image).toEqual(images);
  });

  it("includes category when present", () => {
    const ld = productJsonLd(fakeProduct({ categoryName: "Abayas" }), fakeSite());
    expect(ld.category).toBe("Abayas");
  });

  it("sets category undefined when not present", () => {
    const ld = productJsonLd(fakeProduct({ categoryName: null }), fakeSite());
    expect(ld.category).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/*  jsonLdString                                                       */
/* ------------------------------------------------------------------ */
describe("jsonLdString", () => {
  it("serialises data to JSON", () => {
    const result = jsonLdString({ name: "Test" });
    expect(JSON.parse(result)).toEqual({ name: "Test" });
  });

  it("escapes < to prevent script breakouts", () => {
    const result = jsonLdString({ html: "</script><script>alert(1)</script>" });
    expect(result).not.toContain("</script>");
    expect(result).toContain("\\u003c");
  });

  it("handles nested objects", () => {
    const data = { a: { b: { c: "test" } } };
    const result = jsonLdString(data);
    expect(JSON.parse(result)).toEqual(data);
  });
});
