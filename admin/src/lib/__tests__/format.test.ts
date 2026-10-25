import { describe, it, expect } from "vitest";
import { money, date, toLocalInput, slugify, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/format";

describe("money", () => {
  it("formats a number with Rs. prefix", () => {
    expect(money(1000)).toBe("Rs. 1,000");
  });
  it("formats zero", () => {
    expect(money(0)).toBe("Rs. 0");
  });
  it("formats decimal amount", () => {
    expect(money(49.5)).toBe("Rs. 49.5");
  });
  it("returns dash for null", () => {
    expect(money(null)).toBe("—");
  });
  it("returns dash for undefined", () => {
    expect(money(undefined)).toBe("—");
  });
  it("formats large numbers with commas", () => {
    expect(money(1234567)).toBe("Rs. 1,234,567");
  });
});

describe("date", () => {
  it("formats ISO date to DD Mon YYYY", () => {
    expect(date("2024-01-15T12:00:00Z")).toBe("15 Jan 2024");
  });
  it("returns dash for null", () => {
    expect(date(null)).toBe("—");
  });
  it("returns dash for undefined", () => {
    expect(date(undefined)).toBe("—");
  });
  it("returns dash for empty string", () => {
    expect(date("")).toBe("—");
  });
  it("includes time when withTime is true", () => {
    const result = date("2024-06-15T14:30:00Z", true);
    expect(result).toContain("2024");
    // Time part depends on timezone but should be present
    expect(result.length).toBeGreaterThan(12);
  });
});

describe("toLocalInput", () => {
  it("converts ISO to datetime-local format", () => {
    const result = toLocalInput("2024-06-15T14:30:00");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
  it("returns empty string for null", () => {
    expect(toLocalInput(null)).toBe("");
  });
  it("returns empty string for undefined", () => {
    expect(toLocalInput(undefined)).toBe("");
  });
  it("returns empty string for empty string", () => {
    expect(toLocalInput("")).toBe("");
  });
});

describe("slugify", () => {
  it("converts to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
  it("replaces spaces with hyphens", () => {
    expect(slugify("hello world")).toBe("hello-world");
  });
  it("removes special characters", () => {
    expect(slugify("hello@world!")).toBe("helloworld");
  });
  it("collapses multiple hyphens", () => {
    expect(slugify("hello---world")).toBe("hello-world");
  });
  it("trims whitespace", () => {
    expect(slugify("  hello  ")).toBe("hello");
  });
  it("handles multiple spaces", () => {
    expect(slugify("hello   world")).toBe("hello-world");
  });
  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
  it("handles alphanumeric with hyphens", () => {
    expect(slugify("3 PC Khaddar")).toBe("3-pc-khaddar");
  });
});

describe("ORDER_STATUS_LABEL", () => {
  it("maps all order statuses", () => {
    expect(ORDER_STATUS_LABEL.pending).toBe("Pending");
    expect(ORDER_STATUS_LABEL.confirmed).toBe("Confirmed");
    expect(ORDER_STATUS_LABEL.processing).toBe("Processing");
    expect(ORDER_STATUS_LABEL.shipped).toBe("Shipped");
    expect(ORDER_STATUS_LABEL.out_for_delivery).toBe("Out for Delivery");
    expect(ORDER_STATUS_LABEL.delivered).toBe("Delivered");
    expect(ORDER_STATUS_LABEL.cancelled).toBe("Cancelled");
    expect(ORDER_STATUS_LABEL.refunded).toBe("Refunded");
  });
});

describe("PAYMENT_STATUS_LABEL", () => {
  it("maps all payment statuses", () => {
    expect(PAYMENT_STATUS_LABEL.pending).toBe("Pending");
    expect(PAYMENT_STATUS_LABEL.paid).toBe("Paid");
    expect(PAYMENT_STATUS_LABEL.failed).toBe("Failed");
    expect(PAYMENT_STATUS_LABEL.refunded).toBe("Refunded");
    expect(PAYMENT_STATUS_LABEL.cancelled).toBe("Cancelled");
  });
});
