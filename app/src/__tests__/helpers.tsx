/**
 * Shared test helpers and mock factories for component tests.
 */
import React, { type ReactNode } from "react";
import { vi } from "vitest";
import type { Product, Collection, Cart, CartLine, Banner, Order, OrderStatus, TrustItem, SiteConfig, Facets } from "@/types";

/* ─── Mock Store ─── */

export const mockStore = {
  user: null as { id: number; name: string; email: string; phone: string | null; role: "customer" } | null,
  authReady: true,
  cart: null as Cart | null,
  cartBusy: false,
  cartError: null as string | null,
  count: 0,
  isCartOpen: false,
  openCart: vi.fn(),
  closeCart: vi.fn(),
  refreshCart: vi.fn(),
  addToCart: vi.fn().mockResolvedValue(true),
  updateQuantity: vi.fn(),
  removeFromCart: vi.fn(),
  applyCoupon: vi.fn(),
  removeCoupon: vi.fn(),
  setCart: vi.fn(),
  wishlist: [] as number[],
  toggleWishlist: vi.fn(),
  isWishlisted: vi.fn().mockReturnValue(false),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  setUser: vi.fn(),
};

vi.mock("@/context/StoreProvider", () => ({
  useStore: () => mockStore,
  StoreProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/context/ToastContext", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
  ToastProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/api", () => ({
  api: {
    subscribe: vi.fn().mockResolvedValue({ message: "Subscribed!" }),
    products: vi.fn().mockResolvedValue({ data: [], meta: { currentPage: 1, lastPage: 1, perPage: 24, total: 0 } }),
    productReviews: vi.fn().mockResolvedValue({
      reviews: [],
      summary: { average: 0, count: 0, distribution: [] },
      page: 1,
      lastPage: 1,
    }),
    submitReview: vi.fn().mockResolvedValue({ message: "Review submitted!" }),
  },
  ApiError: class ApiError extends Error {
    status: number;
    errors: Record<string, string[]>;
    constructor(msg: string, status: number, errors: Record<string, string[]> = {}) {
      super(msg);
      this.status = status;
      this.errors = errors;
    }
    field(name: string) {
      return this.errors[name]?.[0];
    }
  },
  getCartToken: vi.fn().mockReturnValue(null),
}));

/* ─── Factories ─── */

export function fakeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    slug: "black-abaya",
    sku: "BA-001",
    title: "Black Abaya",
    brand: "Inaya",
    categorySlug: "abayas",
    categoryName: "Abayas",
    price: 3500,
    compareAtPrice: null,
    discountPercent: 0,
    images: ["https://cdn.example.com/img1.jpg", "https://cdn.example.com/img2.jpg"],
    inStock: true,
    isAvailable: true,
    fabric: "Chiffon",
    pieces: 2,
    details: ["Shirt", "Dupatta"],
    shortDescription: "A beautiful black abaya",
    description: "Full description here",
    variants: [{ id: 10, sku: "BA-001-M", name: "Size M", options: { size: "M" }, price: 3500, compareAtPrice: null, inStock: true, lowStock: false }],
    defaultVariantId: 10,
    variantsCount: 1,
    metaTitle: null,
    metaDescription: null,
    publishedAt: null,
    updatedAt: null,
    ...overrides,
  };
}

export function fakeCollection(overrides: Partial<Collection> = {}): Collection {
  return {
    id: 1,
    slug: "winter",
    title: "Winter Collection",
    shortTitle: "Winter",
    rank: 1,
    image: "https://cdn.example.com/winter.jpg",
    description: null,
    productCount: 10,
    metaTitle: null,
    metaDescription: null,
    children: [],
    ...overrides,
  };
}

export function fakeBanner(overrides: Partial<Banner> = {}): Banner {
  return {
    id: 1,
    title: "Big Sale",
    subtitle: "Up to 50% off",
    image: "https://cdn.example.com/banner.jpg",
    mobileImage: null,
    buttons: [{ label: "Shop Now", href: "/collections/all" }],
    ...overrides,
  };
}

export function fakeCartLine(overrides: Partial<CartLine> = {}): CartLine {
  return {
    id: 1,
    variantId: 10,
    productId: 1,
    slug: "black-abaya",
    name: "Black Abaya",
    variantName: "Size M",
    sku: "BA-001-M",
    image: "https://cdn.example.com/img.jpg",
    unitPrice: 3500,
    regularPrice: 5000,
    quantity: 2,
    maxQuantity: 10,
    lineTotal: 7000,
    inStock: true,
    ...overrides,
  };
}

export function fakeOrder(overrides: Partial<Order> = {}): Order {
  return {
    number: "ORD-001",
    status: "confirmed" as OrderStatus,
    paymentStatus: "paid",
    paymentMethodLabel: "Cash on Delivery",
    shippingMethod: "standard",
    customerName: "Ali Khan",
    email: "ali@test.com",
    phone: "0300-1234567",
    shippingAddress: { full_name: "Ali Khan", phone: "0300-1234567", line1: "123 Main St", city: "Lahore", country: "PK" },
    subtotal: 7000,
    discountTotal: 0,
    shippingTotal: 200,
    taxTotal: 0,
    grandTotal: 7200,
    couponCode: null,
    itemsCount: 2,
    items: [{ id: 1, name: "Black Abaya", variantName: "Size M", sku: "BA-001-M", image: null, unitPrice: 3500, quantity: 2, lineTotal: 7000, productId: 1 }],
    statusHistory: [{ from: null, to: "pending" as OrderStatus, note: null, at: "2024-01-01T00:00:00Z" }],
    shipment: null,
    canCancel: true,
    placedAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

export function fakeSiteConfig(overrides: Partial<SiteConfig> = {}): SiteConfig {
  return {
    name: "Inaya Collection",
    logoType: "text",
    logoUrl: null,
    tagline: "Fashion for all",
    about: "About us text",
    email: "info@inaya.pk",
    phone: "0300-1234567",
    whatsapp: null,
    address: null,
    hours: "Mon-Sat 10am-8pm",
    currencySymbol: "Rs.",
    announcements: [],
    freeShippingThreshold: 5000,
    shippingMethods: [{ code: "standard", name: "Standard", fee: 200 }],
    paymentMethods: [{ code: "cod", name: "Cash on Delivery" }],
    allowGuestCheckout: true,
    maxQuantityPerItem: 10,
    navigation: [{ label: "Home", href: "/" }, { label: "Shop", href: "/collections/all" }],
    trust: [],
    footer: { columns: [{ heading: "Info", links: [{ label: "About", href: "/pages/about" }] }], copyright: "2024 Inaya", logoUrl: null },
    social: [{ label: "Instagram", href: "https://instagram.com" }],
    seo: { defaultTitle: "Inaya", defaultDescription: "Shop", ogImage: null },
    ...overrides,
  };
}

export function fakeFacets(overrides: Partial<Facets> = {}): Facets {
  return {
    fabrics: ["Cotton", "Silk", "Chiffon"],
    pieces: [2, 3],
    brands: ["Inaya"],
    price: { min: 500, max: 15000 },
    ...overrides,
  };
}
