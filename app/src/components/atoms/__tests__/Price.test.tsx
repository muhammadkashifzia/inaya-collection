import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Price } from "../Price";

describe("Price", () => {
  it("renders the formatted price", () => {
    render(<Price price={3500} />);
    expect(screen.getByText("Rs.3,500.00")).toBeInTheDocument();
  });

  it("shows 'Price' sr-only label when not on sale", () => {
    render(<Price price={1000} />);
    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getByText("Price")).toHaveClass("sr-only");
  });

  it("shows sale price with 'Sale price' sr-only label when on sale", () => {
    render(<Price price={750} compareAtPrice={1000} />);
    expect(screen.getByText("Sale price")).toBeInTheDocument();
    expect(screen.getByText("Rs.750.00")).toBeInTheDocument();
  });

  it("shows strikethrough regular price when on sale", () => {
    render(<Price price={750} compareAtPrice={1000} />);
    expect(screen.getByText("Regular price")).toBeInTheDocument();
    expect(screen.getByText("Rs.1,000.00")).toBeInTheDocument();
    // The regular price should be in a <s> tag
    const strikethrough = screen.getByText("Rs.1,000.00").closest("s");
    expect(strikethrough).toBeInTheDocument();
  });

  it("does not show sale styling when compareAtPrice is null", () => {
    render(<Price price={500} compareAtPrice={null} />);
    expect(screen.queryByText("Sale price")).not.toBeInTheDocument();
    expect(screen.queryByText("Regular price")).not.toBeInTheDocument();
  });

  it("does not show sale styling when compareAtPrice <= price", () => {
    render(<Price price={1000} compareAtPrice={1000} />);
    expect(screen.queryByText("Sale price")).not.toBeInTheDocument();
  });

  it("does not show sale styling when compareAtPrice < price", () => {
    render(<Price price={1000} compareAtPrice={500} />);
    expect(screen.queryByText("Sale price")).not.toBeInTheDocument();
  });

  it("applies sm size classes by default", () => {
    const { container } = render(<Price price={100} />);
    const priceEl = container.querySelector(".text-sm");
    expect(priceEl).toBeInTheDocument();
  });

  it("applies lg size classes", () => {
    const { container } = render(<Price price={100} size="lg" />);
    const priceEl = container.querySelector(".text-2xl");
    expect(priceEl).toBeInTheDocument();
  });
});
