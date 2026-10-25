import { describe, it, expect } from "vitest";
import { ApiError, toQuery } from "@/lib/api";

describe("ApiError", () => {
  it("creates error with message, status, and errors", () => {
    const err = new ApiError("Bad request", 422, { email: ["Email is required"] });
    expect(err.message).toBe("Bad request");
    expect(err.status).toBe(422);
    expect(err.errors).toEqual({ email: ["Email is required"] });
    expect(err).toBeInstanceOf(Error);
  });

  it("defaults errors to empty object", () => {
    const err = new ApiError("Not found", 404);
    expect(err.errors).toEqual({});
  });

  describe("field()", () => {
    it("returns first error for exact field match", () => {
      const err = new ApiError("Validation", 422, { email: ["Email is required", "Email is invalid"] });
      expect(err.field("email")).toBe("Email is required");
    });

    it("returns undefined for non-existent field", () => {
      const err = new ApiError("Validation", 422, { email: ["Required"] });
      expect(err.field("phone")).toBeUndefined();
    });

    it("supports prefix matching for nested fields", () => {
      const err = new ApiError("Validation", 422, { "variants.0.sku": ["SKU is required"] });
      expect(err.field("variants")).toBe("SKU is required");
    });
  });

  describe("firstMessage", () => {
    it("returns first validation error message", () => {
      const err = new ApiError("Validation", 422, { name: ["Name required"], email: ["Email required"] });
      expect(err.firstMessage).toBe("Name required");
    });

    it("falls back to message when no field errors", () => {
      const err = new ApiError("Server error", 500);
      expect(err.firstMessage).toBe("Server error");
    });
  });
});

describe("toQuery", () => {
  it("returns empty string for empty query", () => {
    expect(toQuery({})).toBe("");
  });

  it("builds query string with ? prefix", () => {
    expect(toQuery({ page: 2 })).toBe("?page=2");
  });

  it("skips null values", () => {
    expect(toQuery({ page: 1, search: null })).toBe("?page=1");
  });

  it("skips undefined values", () => {
    expect(toQuery({ page: 1, search: undefined })).toBe("?page=1");
  });

  it("skips empty string values", () => {
    expect(toQuery({ page: 1, search: "" })).toBe("?page=1");
  });

  it("converts boolean true to '1'", () => {
    expect(toQuery({ active: true })).toBe("?active=1");
  });

  it("converts boolean false to '0'", () => {
    expect(toQuery({ active: false })).toBe("?active=0");
  });

  it("converts numbers to strings", () => {
    expect(toQuery({ page: 3, per_page: 25 })).toBe("?page=3&per_page=25");
  });

  it("passes through string values", () => {
    expect(toQuery({ q: "hello" })).toBe("?q=hello");
  });

  it("handles mixed query params", () => {
    const result = toQuery({ page: 1, search: "test", active: true, empty: null });
    expect(result).toContain("page=1");
    expect(result).toContain("search=test");
    expect(result).toContain("active=1");
    expect(result).not.toContain("empty");
  });
});
