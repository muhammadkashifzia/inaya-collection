/**
 * Integration test: CartView page composes CartLineItem molecules
 * with store context for a full cart experience.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import "../helpers";
import { mockStore, fakeCartLine } from "../helpers";
import { CartView } from "@/app/cart/CartView";
import type { Cart } from "@/types";

function fakeCart(overrides: Partial<Cart> = {}): Cart {
  return {
    token: "tk-1",
    items: [fakeCartLine({ id: 1, name: "Black Abaya", variantName: "Size M", unitPrice: 3500, regularPrice: 5000, quantity: 2, lineTotal: 7000 })],
    issues: [],
    couponCode: null,
    couponError: null,
    itemCount: 2,
    subtotal: 7000,
    discountTotal: 0,
    shippingTotal: 0,
    taxTotal: 0,
    grandTotal: 7000,
    ...overrides,
  };
}

describe("CartView integration", () => {
  beforeEach(() => {
    mockStore.cart = null;
    mockStore.cartError = null;
  });

  it("shows loading state when cart is null", () => {
    mockStore.cart = null;
    render(<CartView />);
    expect(screen.getByText(/Loading your cart/i)).toBeInTheDocument();
  });

  it("shows empty cart state", () => {
    mockStore.cart = fakeCart({ items: [], itemCount: 0 });
    render(<CartView />);
    expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Continue shopping/i })).toBeInTheDocument();
  });

  it("renders cart items with product name and variant", () => {
    mockStore.cart = fakeCart();
    render(<CartView />);
    expect(screen.getByText("Black Abaya")).toBeInTheDocument();
    expect(screen.getByText("Size M")).toBeInTheDocument();
  });

  it("renders cart item prices", () => {
    mockStore.cart = fakeCart();
    render(<CartView />);
    expect(screen.getByText("Rs.3,500.00")).toBeInTheDocument();
  });

  it("renders sale price with strikethrough for discounted items", () => {
    mockStore.cart = fakeCart();
    render(<CartView />);
    // unitPrice (3500) < regularPrice (5000) → shows strikethrough
    expect(screen.getByText("Rs.5,000.00")).toBeInTheDocument();
  });

  it("shows cart error when present", () => {
    mockStore.cart = fakeCart();
    mockStore.cartError = "Could not update your cart.";
    render(<CartView />);
    expect(screen.getByRole("alert")).toHaveTextContent("Could not update your cart.");
  });

  it("shows issue warning on affected items", () => {
    mockStore.cart = fakeCart({ issues: [{ itemId: 1, message: "Only 1 left in stock" }] });
    render(<CartView />);
    expect(screen.getByText("Only 1 left in stock")).toBeInTheDocument();
  });

  it("renders checkout link", () => {
    mockStore.cart = fakeCart();
    render(<CartView />);
    expect(screen.getByRole("link", { name: /Proceed to checkout/i })).toHaveAttribute("href", "/checkout");
  });

  it("renders Order summary heading", () => {
    mockStore.cart = fakeCart();
    render(<CartView />);
    expect(screen.getByRole("heading", { name: /Order summary/i })).toBeInTheDocument();
  });

  it("renders quantity selector for cart items", () => {
    mockStore.cart = fakeCart();
    render(<CartView />);
    expect(screen.getByText("2")).toBeInTheDocument(); // quantity display
    expect(screen.getByRole("button", { name: /Decrease quantity/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Increase quantity/i })).toBeInTheDocument();
  });

  it("renders remove button for cart items", () => {
    mockStore.cart = fakeCart();
    render(<CartView />);
    expect(screen.getByRole("button", { name: /Remove Black Abaya/i })).toBeInTheDocument();
  });
});
