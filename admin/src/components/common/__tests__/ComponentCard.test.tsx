import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ComponentCard from "@/components/common/ComponentCard";

describe("ComponentCard", () => {
  it("renders title", () => {
    render(<ComponentCard title="Settings"><p>Content</p></ComponentCard>);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(<ComponentCard title="T"><p>Card content</p></ComponentCard>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<ComponentCard title="T" desc="A description"><div /></ComponentCard>);
    expect(screen.getByText("A description")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    const { container } = render(<ComponentCard title="T"><div /></ComponentCard>);
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });

  it("merges custom className", () => {
    const { container } = render(<ComponentCard title="T" className="mt-4"><div /></ComponentCard>);
    expect(container.firstChild).toHaveClass("mt-4");
  });
});
