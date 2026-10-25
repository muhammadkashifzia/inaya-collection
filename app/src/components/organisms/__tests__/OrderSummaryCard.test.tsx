import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { fakeOrder } from "@//__tests__/helpers";
import { OrderSummaryCard, statusLabel } from "../OrderSummaryCard";

describe("statusLabel", () => {
  it("maps known statuses", () => {
    expect(statusLabel("pending")).toBe("Order placed");
    expect(statusLabel("confirmed")).toBe("Confirmed");
    expect(statusLabel("processing")).toBe("Processing");
    expect(statusLabel("shipped")).toBe("Shipped");
    expect(statusLabel("out_for_delivery")).toBe("Out for delivery");
    expect(statusLabel("delivered")).toBe("Delivered");
    expect(statusLabel("cancelled")).toBe("Cancelled");
    expect(statusLabel("refunded")).toBe("Refunded");
  });
});

describe("OrderSummaryCard", () => {
  it("renders order number and date", () => {
    render(<OrderSummaryCard order={fakeOrder()} />);
    expect(screen.getByText(/Order ORD-001/)).toBeInTheDocument();
    expect(screen.getByText(/Placed on/)).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<OrderSummaryCard order={fakeOrder({ status: "confirmed" })} />);
    const badges = screen.getAllByText("Confirmed");
    // Badge + progress tracker both show "Confirmed"
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("renders progress tracker for active orders", () => {
    render(<OrderSummaryCard order={fakeOrder({ status: "processing" })} />);
    expect(screen.getByRole("list", { name: "Order progress" })).toBeInTheDocument();
  });

  it("hides progress tracker for cancelled orders", () => {
    render(<OrderSummaryCard order={fakeOrder({ status: "cancelled" })} />);
    expect(screen.queryByRole("list", { name: "Order progress" })).not.toBeInTheDocument();
  });

  it("hides progress tracker for refunded orders", () => {
    render(<OrderSummaryCard order={fakeOrder({ status: "refunded" })} />);
    expect(screen.queryByRole("list", { name: "Order progress" })).not.toBeInTheDocument();
  });

  it("shows shipment tracking when available", () => {
    render(<OrderSummaryCard order={fakeOrder({ shipment: { carrier: "TCS", trackingNumber: "TR123", trackingUrl: "https://track.com/TR123", shippedAt: "2024-01-02", deliveredAt: null } })} />);
    expect(screen.getByText("TR123")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Track shipment" })).toHaveAttribute("href", "https://track.com/TR123");
  });

  it("renders order items", () => {
    render(<OrderSummaryCard order={fakeOrder()} />);
    expect(screen.getByText("Black Abaya")).toBeInTheDocument();
    expect(screen.getByText(/Size M/)).toBeInTheDocument();
  });

  it("renders totals", () => {
    render(<OrderSummaryCard order={fakeOrder({ subtotal: 7000, grandTotal: 7200, shippingTotal: 200 })} />);
    // Subtotal appears in item line and in summary, use getAllByText
    expect(screen.getAllByText("Rs.7,000.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Rs.7,200.00")).toBeInTheDocument();
    expect(screen.getByText("Rs.200.00")).toBeInTheDocument();
  });

  it("shows Free for zero shipping", () => {
    render(<OrderSummaryCard order={fakeOrder({ shippingTotal: 0 })} />);
    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("shows discount when present", () => {
    render(<OrderSummaryCard order={fakeOrder({ discountTotal: 500, couponCode: "SAVE10" })} />);
    const discountElements = screen.getAllByText(/Discount/);
    expect(discountElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/SAVE10/)).toBeInTheDocument();
  });

  it("renders delivery address", () => {
    render(<OrderSummaryCard order={fakeOrder()} />);
    expect(screen.getByText(/Ali Khan/)).toBeInTheDocument();
    expect(screen.getByText(/Lahore/)).toBeInTheDocument();
  });

  it("renders payment method", () => {
    render(<OrderSummaryCard order={fakeOrder({ paymentMethodLabel: "Cash on Delivery" })} />);
    expect(screen.getByText(/Cash on Delivery/)).toBeInTheDocument();
  });
});
