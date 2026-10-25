import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ServiceHighlights } from "../ServiceHighlights";

describe("ServiceHighlights", () => {
  it("renders all 4 service highlights", () => {
    render(<ServiceHighlights freeShippingThreshold={3000} />);
    expect(screen.getByText("Free Shipping")).toBeInTheDocument();
    expect(screen.getByText("2 Days Exchange Policy")).toBeInTheDocument();
    expect(screen.getByText("Cash on Delivery")).toBeInTheDocument();
    expect(screen.getByText("Customer Centric Support")).toBeInTheDocument();
  });

  it("shows threshold-specific text when threshold is provided", () => {
    render(<ServiceHighlights freeShippingThreshold={3000} />);
    expect(screen.getByText(/Free shipping on all orders above PKR 3,000/)).toBeInTheDocument();
  });

  it("shows generic text when threshold is null", () => {
    render(<ServiceHighlights freeShippingThreshold={null} />);
    expect(screen.getByText("Free shipping on all orders")).toBeInTheDocument();
  });

  it("has accessible section label", () => {
    render(<ServiceHighlights freeShippingThreshold={null} />);
    expect(screen.getByRole("region", { name: "Our services" })).toBeInTheDocument();
  });
});
