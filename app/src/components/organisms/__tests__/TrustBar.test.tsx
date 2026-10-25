import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TrustBar } from "../TrustBar";
import type { TrustItem } from "@/types";

describe("TrustBar", () => {
  const items: TrustItem[] = [
    { icon: "truck", title: "Free Shipping", text: "On all orders" },
    { icon: "shield", title: "Secure Payment", text: "100% secure" },
  ];

  it("renders all trust items", () => {
    render(<TrustBar items={items} />);
    expect(screen.getByText("Free Shipping")).toBeInTheDocument();
    expect(screen.getByText("Secure Payment")).toBeInTheDocument();
  });

  it("has accessible section label", () => {
    render(<TrustBar items={items} />);
    expect(screen.getByRole("region", { name: "Why shop with us" })).toBeInTheDocument();
  });

  it("renders correct number of items", () => {
    render(<TrustBar items={items} />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(2);
  });
});
