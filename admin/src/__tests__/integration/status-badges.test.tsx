/**
 * Integration test: StatusBadge components render correct labels and
 * color-coded badges across all status types.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { OrderStatusBadge, PaymentStatusBadge, ProductStatusBadge, ActiveBadge } from "@/components/admin/StatusBadge";
import type { OrderStatus, PaymentStatus, ProductStatus } from "@/types/api";

describe("OrderStatusBadge integration", () => {
  const statuses: [OrderStatus, string][] = [
    ["pending", "Pending"],
    ["confirmed", "Confirmed"],
    ["processing", "Processing"],
    ["shipped", "Shipped"],
    ["out_for_delivery", "Out for Delivery"],
    ["delivered", "Delivered"],
    ["cancelled", "Cancelled"],
    ["refunded", "Refunded"],
  ];

  statuses.forEach(([status, label]) => {
    it(`renders "${label}" for status "${status}"`, () => {
      render(<OrderStatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});

describe("PaymentStatusBadge integration", () => {
  const statuses: [PaymentStatus, string][] = [
    ["pending", "Pending"],
    ["paid", "Paid"],
    ["failed", "Failed"],
    ["refunded", "Refunded"],
    ["cancelled", "Cancelled"],
  ];

  statuses.forEach(([status, label]) => {
    it(`renders "${label}" for status "${status}"`, () => {
      render(<PaymentStatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});

describe("ProductStatusBadge integration", () => {
  const statuses: [ProductStatus, string][] = [
    ["active", "Active"],
    ["draft", "Draft"],
    ["archived", "Archived"],
  ];

  statuses.forEach(([status, label]) => {
    it(`renders "${label}" for status "${status}"`, () => {
      render(<ProductStatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});

describe("ActiveBadge integration", () => {
  it("shows 'Active' when true", () => {
    render(<ActiveBadge active={true} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows 'Inactive' when false", () => {
    render(<ActiveBadge active={false} />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("accepts custom labels", () => {
    render(<ActiveBadge active={true} on="Published" off="Hidden" />);
    expect(screen.getByText("Published")).toBeInTheDocument();
  });

  it("shows custom off label", () => {
    render(<ActiveBadge active={false} on="Published" off="Hidden" />);
    expect(screen.getByText("Hidden")).toBeInTheDocument();
  });
});
