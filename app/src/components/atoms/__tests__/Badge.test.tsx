import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "../Badge";

describe("Badge", () => {
  it("renders children text", () => {
    render(<Badge>SALE</Badge>);
    expect(screen.getByText("SALE")).toBeInTheDocument();
  });

  it("renders a span element", () => {
    render(<Badge>NEW</Badge>);
    const el = screen.getByText("NEW");
    expect(el.tagName).toBe("SPAN");
  });

  it("applies sale tone by default", () => {
    render(<Badge>50% OFF</Badge>);
    const el = screen.getByText("50% OFF");
    expect(el.className).toContain("bg-brand");
    expect(el.className).toContain("text-white");
  });

  it("applies dark tone", () => {
    render(<Badge tone="dark">SOLD OUT</Badge>);
    const el = screen.getByText("SOLD OUT");
    expect(el.className).toContain("bg-ink");
  });

  it("applies muted tone", () => {
    render(<Badge tone="muted">LOW STOCK</Badge>);
    const el = screen.getByText("LOW STOCK");
    expect(el.className).toContain("bg-muted");
  });

  it("applies light tone", () => {
    render(<Badge tone="light">NEW</Badge>);
    const el = screen.getByText("NEW");
    expect(el.className).toContain("bg-white");
    expect(el.className).toContain("text-ink");
  });

  it("merges additional className", () => {
    render(<Badge className="mt-4">CUSTOM</Badge>);
    const el = screen.getByText("CUSTOM");
    expect(el.className).toContain("mt-4");
  });
});
