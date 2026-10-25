import { describe, it, expect } from "vitest";
import { formatPrice, discountPercent, formatDate, cn } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  formatPrice                                                        */
/* ------------------------------------------------------------------ */
describe("formatPrice", () => {
  it("formats a whole number with two decimal places", () => {
    expect(formatPrice(1000)).toBe("Rs.1,000.00");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("Rs.0.00");
  });

  it("formats a decimal number", () => {
    expect(formatPrice(49.5)).toBe("Rs.49.50");
  });

  it("formats a large number with commas", () => {
    expect(formatPrice(1234567)).toBe("Rs.1,234,567.00");
  });

  it("formats a small fractional price", () => {
    expect(formatPrice(0.99)).toBe("Rs.0.99");
  });
});

/* ------------------------------------------------------------------ */
/*  discountPercent                                                     */
/* ------------------------------------------------------------------ */
describe("discountPercent", () => {
  it("returns 0 when compareAt is null", () => {
    expect(discountPercent(500, null)).toBe(0);
  });

  it("returns 0 when compareAt is 0 (falsy)", () => {
    expect(discountPercent(500, 0)).toBe(0);
  });

  it("returns 0 when compareAt equals price", () => {
    expect(discountPercent(500, 500)).toBe(0);
  });

  it("returns 0 when compareAt is less than price", () => {
    expect(discountPercent(500, 300)).toBe(0);
  });

  it("calculates correct discount percentage", () => {
    expect(discountPercent(750, 1000)).toBe(25);
  });

  it("rounds to nearest integer", () => {
    // (1000 - 700) / 1000 * 100 = 30
    expect(discountPercent(700, 1000)).toBe(30);
    // (1000 - 333) / 1000 * 100 = 66.7 → 67
    expect(discountPercent(333, 1000)).toBe(67);
  });

  it("handles 100% discount (free)", () => {
    expect(discountPercent(0, 1000)).toBe(100);
  });
});

/* ------------------------------------------------------------------ */
/*  formatDate                                                         */
/* ------------------------------------------------------------------ */
describe("formatDate", () => {
  it("formats an ISO date string to DD Mon YYYY", () => {
    const result = formatDate("2024-01-15T12:00:00Z");
    expect(result).toBe("15 Jan 2024");
  });

  it("formats another date correctly", () => {
    const result = formatDate("2025-12-25");
    expect(result).toBe("25 Dec 2025");
  });
});

/* ------------------------------------------------------------------ */
/*  cn (classname utility)                                             */
/* ------------------------------------------------------------------ */
describe("cn", () => {
  it("joins multiple class strings", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out false values", () => {
    expect(cn("a", false, "c")).toBe("a c");
  });

  it("filters out null values", () => {
    expect(cn("a", null, "c")).toBe("a c");
  });

  it("filters out undefined values", () => {
    expect(cn("a", undefined, "c")).toBe("a c");
  });

  it("filters out empty strings", () => {
    expect(cn("a", "", "c")).toBe("a c");
  });

  it("returns empty string when all values are falsy", () => {
    expect(cn(false, null, undefined, "")).toBe("");
  });

  it("works with conditional class patterns", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe("base active");
  });
});
