/**
 * Shared test helpers and mock factories for admin integration tests.
 */
import React, { type ReactNode } from "react";
import { vi } from "vitest";
import type { AdminUser, DashboardData, OrderStatus, PaymentStatus } from "@/types/api";

/* ─── Mock Auth Context ─── */

export const mockAuth = {
  user: null as AdminUser | null,
  ready: true,
  can: vi.fn().mockReturnValue(true),
  login: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  twoFactorState: null as null | "challenge" | "setup",
  verifyTwoFactor: vi.fn(),
  fetchTwoFactorSetup: vi.fn(),
  confirmTwoFactorSetup: vi.fn(),
};

vi.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAuth: () => mockAuth,
}));

vi.mock("@/context/ToastContext", () => ({
  ToastProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useToast: () => ({
    toast: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    ensureCsrf: vi.fn(),
  },
  API_URL: "http://localhost:8000",
  STOREFRONT_URL: "http://localhost:3000",
  ApiError: class ApiError extends Error {
    status: number;
    errors: Record<string, string[]>;
    constructor(msg: string, status: number, errors: Record<string, string[]> = {}) {
      super(msg);
      this.status = status;
      this.errors = errors;
    }
    field(name: string) { return this.errors[name]?.[0]; }
    get firstMessage() { return Object.values(this.errors)[0]?.[0] ?? this.message; }
  },
  setUnauthorizedHandler: vi.fn(),
  toQuery: (q: Record<string, unknown> = {}) => {
    const p = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.set(k, String(v)); });
    const s = p.toString();
    return s ? `?${s}` : "";
  },
}));

/* ─── Factories ─── */

export function fakeAdminUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 1,
    name: "Ali Khan",
    email: "ali@inaya.pk",
    phone: "0300-1234567",
    role: "admin",
    is_active: true,
    permissions: ["view-dashboard", "manage-products", "manage-orders", "manage-categories", "manage-inventory", "view-customers", "manage-coupons", "manage-content", "manage-messages", "manage-settings"],
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

export function fakeDashboardData(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    totals: {
      revenue: 1250000,
      orders: 342,
      customers: 189,
      products: 45,
      pending_orders: 12,
      completed_orders: 280,
      cancelled_orders: 15,
      low_stock_variants: 3,
    },
    status_counts: { pending: 12, confirmed: 20, processing: 15, shipped: 8, delivered: 280, cancelled: 15 },
    sales: [
      { date: "2024-01-01", orders: 5, revenue: 25000 },
      { date: "2024-01-02", orders: 8, revenue: 42000 },
    ],
    best_sellers: [
      { product_id: 1, name: "Black Khaddar Suit", units: 45, revenue: 157500 },
      { product_id: 2, name: "Silk Abaya", units: 32, revenue: 160000 },
    ],
    low_stock: [
      { id: 1, sku: "BK-001-M", name: "Size M", stock: 2, product_id: 1, product_name: "Black Khaddar", low_stock_threshold: 5 },
    ],
    recent_orders: [
      { number: "ORD-001", customer_name: "Sara Ahmed", email: "sara@test.com", status: "confirmed" as OrderStatus, payment_status: "paid" as PaymentStatus, grand_total: 5500, placed_at: "2024-06-15T10:00:00Z" },
      { number: "ORD-002", customer_name: "Fatima Khan", email: "fatima@test.com", status: "pending" as OrderStatus, payment_status: "pending" as PaymentStatus, grand_total: 3200, placed_at: "2024-06-14T09:00:00Z" },
    ],
    revenue_definition: "Revenue from delivered orders",
    ...overrides,
  };
}
