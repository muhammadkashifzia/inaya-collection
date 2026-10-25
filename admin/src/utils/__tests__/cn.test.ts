import { describe, it, expect } from "vitest";
import { cn } from "@/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("filters falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    expect(cn("base", isActive && "active")).toBe("base active");
  });

  it("merges tailwind classes correctly (twMerge)", () => {
    // twMerge resolves conflicting tailwind classes
    expect(cn("px-4", "px-6")).toBe("px-6");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles arrays from clsx", () => {
    expect(cn(["a", "b"])).toBe("a b");
  });
});
