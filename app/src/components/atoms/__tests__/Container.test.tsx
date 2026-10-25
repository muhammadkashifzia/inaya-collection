import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Container } from "../Container";

describe("Container", () => {
  it("renders children", () => {
    render(<Container><p>Hello</p></Container>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("applies default layout classes", () => {
    render(<Container><span>content</span></Container>);
    const el = screen.getByText("content").parentElement!;
    expect(el.className).toContain("mx-auto");
    expect(el.className).toContain("max-w-7xl");
    expect(el.className).toContain("px-4");
  });

  it("merges custom className", () => {
    render(<Container className="py-8"><span>content</span></Container>);
    const el = screen.getByText("content").parentElement!;
    expect(el.className).toContain("py-8");
    expect(el.className).toContain("mx-auto");
  });
});
