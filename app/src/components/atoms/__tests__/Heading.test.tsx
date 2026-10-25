import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Heading } from "../Heading";

describe("Heading", () => {
  it("renders as h2 by default", () => {
    render(<Heading>Title</Heading>);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Title");
  });

  it("renders correct heading level", () => {
    const { rerender } = render(<Heading level={1}>H1</Heading>);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();

    rerender(<Heading level={3}>H3</Heading>);
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();

    rerender(<Heading level={4}>H4</Heading>);
    expect(screen.getByRole("heading", { level: 4 })).toBeInTheDocument();
  });

  it("overrides tag with 'as' prop", () => {
    render(<Heading level={2} as="h1">Visual H2, Semantic H1</Heading>);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("applies center alignment", () => {
    render(<Heading align="center">Centered</Heading>);
    expect(screen.getByRole("heading").className).toContain("text-center");
  });

  it("does not apply text-center by default", () => {
    render(<Heading>Left</Heading>);
    expect(screen.getByRole("heading").className).not.toContain("text-center");
  });

  it("merges custom className", () => {
    render(<Heading className="mb-4">Custom</Heading>);
    expect(screen.getByRole("heading").className).toContain("mb-4");
  });

  it("applies level-based size classes", () => {
    render(<Heading level={1}>Big</Heading>);
    expect(screen.getByRole("heading").className).toContain("text-3xl");
  });
});
