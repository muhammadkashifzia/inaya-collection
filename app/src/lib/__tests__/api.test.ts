import { describe, it, expect } from "vitest";
import { ApiError } from "@/lib/api";

/**
 * Testing the exported ApiError class.
 * The full api object requires browser APIs (fetch, document.cookie, localStorage)
 * and is better suited for integration tests.
 */
describe("ApiError", () => {
  it("creates an error with message, status, and errors", () => {
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
    it("returns the first error message for an exact field match", () => {
      const err = new ApiError("Validation", 422, {
        email: ["Email is required", "Email is invalid"],
        name: ["Name is required"],
      });
      expect(err.field("email")).toBe("Email is required");
      expect(err.field("name")).toBe("Name is required");
    });

    it("returns undefined for a non-existent field", () => {
      const err = new ApiError("Validation", 422, { email: ["Email is required"] });
      expect(err.field("phone")).toBeUndefined();
    });

    it("supports prefix matching (e.g. nested fields)", () => {
      const err = new ApiError("Validation", 422, {
        "shipping_address.city": ["City is required"],
        "shipping_address.line1": ["Address is required"],
      });
      expect(err.field("shipping_address")).toBe("City is required");
    });

    it("prefers exact match over prefix match", () => {
      const err = new ApiError("Validation", 422, {
        name: ["Exact match"],
        "name.first": ["Prefix match"],
      });
      // Object.keys order: exact match comes first
      expect(err.field("name")).toBe("Exact match");
    });
  });
});
