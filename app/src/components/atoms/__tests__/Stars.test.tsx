import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Stars } from "../Stars";

describe("Stars", () => {
  it("renders with correct aria-label", () => {
    render(<Stars rating={4} />);
    expect(screen.getByRole("img", { name: "4 out of 5 stars" })).toBeInTheDocument();
  });

  it("renders 5 stars by default", () => {
    const { container } = render(<Stars rating={3} />);
    const text = container.textContent!;
    // 3 filled + 2 empty = 5 total
    expect(text.replace(/[^★]/g, "")).toBe("★★★★★");
  });

  it("fills correct number of stars (rounds rating)", () => {
    render(<Stars rating={3.7} />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "3.7 out of 5 stars");
    // 3.7 rounds to 4 filled stars
    const el = screen.getByRole("img");
    const spans = el.querySelectorAll("span");
    // Last span is the empty stars
    const emptyStars = spans[spans.length - 1]?.textContent ?? "";
    expect(emptyStars).toBe("★"); // 1 empty star (4 filled, 1 empty)
  });

  it("clamps rating to max", () => {
    render(<Stars rating={10} max={5} />);
    // Should show 5 filled stars max, not 10
    const el = screen.getByRole("img");
    const emptySpan = el.querySelector("span.text-gray-300");
    expect(emptySpan?.textContent).toBe(""); // no empty stars
  });

  it("clamps negative rating to 0", () => {
    render(<Stars rating={-3} />);
    const el = screen.getByRole("img");
    const emptySpan = el.querySelector("span");
    // All 5 should be empty
    expect(emptySpan?.textContent).toBe("★★★★★");
  });

  it("supports custom max", () => {
    render(<Stars rating={7} max={10} />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "7 out of 10 stars");
    const text = screen.getByRole("img").textContent!.replace(/[^★]/g, "");
    expect(text).toBe("★★★★★★★★★★"); // 10 total stars
  });

  it("merges custom className", () => {
    render(<Stars rating={5} className="text-lg" />);
    expect(screen.getByRole("img").className).toContain("text-lg");
  });
});
