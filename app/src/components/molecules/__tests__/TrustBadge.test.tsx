import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TrustBadge } from "../TrustBadge";

describe("TrustBadge", () => {
  const trustItem = { icon: "truck" as const, title: "Free Shipping", text: "On orders above Rs.3000" };

  it("renders title", () => {
    render(<TrustBadge item={trustItem} />);
    expect(screen.getByText("Free Shipping")).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<TrustBadge item={trustItem} />);
    expect(screen.getByText("On orders above Rs.3000")).toBeInTheDocument();
  });

  it("renders an SVG icon", () => {
    const { container } = render(<TrustBadge item={trustItem} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders title as h3", () => {
    render(<TrustBadge item={trustItem} />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Free Shipping");
  });
});
