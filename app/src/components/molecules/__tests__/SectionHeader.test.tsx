import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SectionHeader } from "../SectionHeader";

describe("SectionHeader", () => {
  it("renders the title as a heading", () => {
    render(<SectionHeader title="New Arrivals" />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("New Arrivals");
  });

  it("renders a decorative line", () => {
    const { container } = render(<SectionHeader title="Test" />);
    const line = container.querySelector("[aria-hidden='true']");
    expect(line).toBeInTheDocument();
  });

  it("renders action slot when provided", () => {
    render(<SectionHeader title="Collections" action={<button>View All</button>} />);
    expect(screen.getByText("View All")).toBeInTheDocument();
  });

  it("does not render action when not provided", () => {
    render(<SectionHeader title="Test" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
