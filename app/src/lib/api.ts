/**
 * Browser API client for the Laravel backend.
 *
 * - Sanctum SPA auth: session + XSRF-TOKEN cookies (HttpOnly session cookie;
 *   no tokens in localStorage). `credentials: "include"` sends them cross-origin.
 * - Guest carts: an opaque cart token (not a credential) kept in localStorage
 *   and sent as `X-Cart-Token`.
 */
"use client";

import { mapAddress, mapCart, mapOrder, mapPaginated, mapProduct, mapUser } from "@/lib/mappers";
import type { Address, AddressInput, Cart, CheckoutInput, ContactInput, Order, Paginated, Product, ProductQuery, ReviewInput, ReviewPage, User } from "@/types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const CART_TOKEN_KEY = "gw-cart-token";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: Record<string, string[]> = {},
  ) {
    super(message);
  }

  /** First message for a field (supports prefix match, e.g. "shipping_address"). */
  field(name: string): string | undefined {
    const key = Object.keys(this.errors).find((k) => k === name || k.startsWith(`${name}.`));
    return key ? this.errors[key][0] : undefined;
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export function getCartToken(): string | null {
  try {
    return window.localStorage.getItem(CART_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setCartToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(CART_TOKEN_KEY, token);
    else window.localStorage.removeItem(CART_TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

let csrfPromise: Promise<void> | null = null;

async function ensureCsrf(force = false): Promise<void> {
  if (!force && readCookie("XSRF-TOKEN")) return;
  csrfPromise ??= fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: "include" }).then(() => {
    csrfPromise = null;
  });
  return csrfPromise;
}

interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const isWrite = method !== "GET";
  if (isWrite) await ensureCsrf();

  const headers: Record<string, string> = { Accept: "application/json", ...options.headers };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const xsrf = readCookie("XSRF-TOKEN");
  if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;
  const cartToken = getCartToken();
  if (cartToken) headers["X-Cart-Token"] = cartToken;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, {
      method,
      headers,
      credentials: "include",
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiError("We couldn't reach the store. Check your connection and try again.", 0);
  }

  // CSRF token expired: refresh once and retry.
  if (res.status === 419 && !retried) {
    await ensureCsrf(true);
    return request<T>(method, path, options, true);
  }

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      res.status === 429
        ? "Too many attempts. Please wait a minute and try again."
        : (json.message as string) || "Something went wrong. Please try again.";
    throw new ApiError(message, res.status, json.errors ?? {});
  }
  return json as T;
}

/** Cart responses carry the guest token; keep it in sync. */
function handleCart(json: unknown): Cart {
  const cart = mapCart(json);
  setCartToken(cart.token);
  return cart;
}

/** Map camelCase address input to the API's snake_case. */
function addressPayload(a: Partial<AddressInput>) {
  return {
    label: a.label,
    full_name: a.fullName,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 || null,
    city: a.city,
    province: a.province || null,
    postal_code: a.postalCode || null,
    country: a.country || "PK",
    is_default_shipping: a.isDefaultShipping,
    is_default_billing: a.isDefaultBilling,
  };
}

export const api = {
  // ----- Auth
  async me(): Promise<User | null> {
    try {
      return mapUser(await request("GET", "/customer/me"));
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
      throw error;
    }
  },
  async login(email: string, password: string, remember = false): Promise<User> {
    const json = await request<{ data: unknown }>("POST", "/customer/login", {
      body: { email, password, remember, cart_token: getCartToken() ?? undefined },
    });
    setCartToken(null);
    return mapUser(json.data);
  },
  async register(input: { name: string; email: string; phone?: string; password: string; passwordConfirmation: string }): Promise<User> {
    const json = await request<{ data: unknown }>("POST", "/auth/register", {
      body: {
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        password: input.password,
        password_confirmation: input.passwordConfirmation,
        cart_token: getCartToken() ?? undefined,
      },
    });
    setCartToken(null);
    return mapUser(json.data);
  },
  logout: () => request<void>("POST", "/customer/logout"),
  forgotPassword: (email: string) => request<{ message: string }>("POST", "/customer/forgot-password", { body: { email } }),
  resetPassword: (input: { token: string; email: string; password: string; passwordConfirmation: string }) =>
    request<{ message: string }>("POST", "/customer/reset-password", {
      body: { token: input.token, email: input.email, password: input.password, password_confirmation: input.passwordConfirmation },
    }),

  // ----- Profile
  async updateProfile(input: { name: string; email: string; phone: string | null }): Promise<User> {
    return mapUser(await request("PUT", "/me", { body: input }));
  },
  updatePassword: (input: { currentPassword: string; password: string; passwordConfirmation: string }) =>
    request<{ message: string }>("PUT", "/me/password", {
      body: { current_password: input.currentPassword, password: input.password, password_confirmation: input.passwordConfirmation },
    }),

  // ----- Addresses
  async addresses(): Promise<Address[]> {
    const json = await request<unknown[]>("GET", "/me/addresses");
    return json.map(mapAddress);
  },
  async createAddress(input: AddressInput): Promise<Address> {
    return mapAddress(await request("POST", "/me/addresses", { body: addressPayload(input) }));
  },
  async updateAddress(id: number, input: Partial<AddressInput>): Promise<Address> {
    return mapAddress(await request("PUT", `/me/addresses/${id}`, { body: addressPayload(input) }));
  },
  deleteAddress: (id: number) => request<void>("DELETE", `/me/addresses/${id}`),

  // ----- Orders
  async orders(page = 1): Promise<Paginated<Order>> {
    return mapPaginated(await request("GET", `/me/orders?page=${page}`), mapOrder);
  },
  async order(number: string): Promise<Order> {
    return mapOrder(await request("GET", `/me/orders/${encodeURIComponent(number)}`));
  },
  async cancelOrder(number: string): Promise<Order> {
    return mapOrder(await request("POST", `/me/orders/${encodeURIComponent(number)}/cancel`));
  },
  async trackOrder(number: string, contact: string): Promise<Order> {
    return mapOrder(await request("POST", "/orders/track", { body: { number, contact } }));
  },

  // ----- Wishlist (signed-in)
  async wishlist(): Promise<{ products: Product[]; ids: number[] }> {
    const json = await request<{ data: unknown[]; product_ids: number[] }>("GET", "/me/wishlist");
    return { products: json.data.map(mapProduct), ids: json.product_ids };
  },
  addToWishlist: (productId: number) => request<void>("POST", "/me/wishlist", { body: { product_id: productId } }),
  removeFromWishlist: (productId: number) => request<void>("DELETE", `/me/wishlist/${productId}`),

  // ----- Catalog (client-side search)
  async products(query: ProductQuery, signal?: AbortSignal): Promise<Paginated<Product>> {
    const params = new URLSearchParams();
    if (query.category) params.set("category", query.category);
    if (query.q) params.set("q", query.q);
    if (query.perPage) params.set("per_page", String(query.perPage));
    if (query.page) params.set("page", String(query.page));
    if (query.sort) params.set("sort", query.sort);
    return mapPaginated(await request("GET", `/products?${params}`, { signal }), mapProduct);
  },

  // ----- Cart
  cart: async (shippingMethod?: string) =>
    handleCart(await request("GET", `/cart${shippingMethod ? `?shipping_method=${encodeURIComponent(shippingMethod)}` : ""}`)),
  addToCart: async (variantId: number, quantity: number) =>
    handleCart(await request("POST", "/cart/items", { body: { variant_id: variantId, quantity } })),
  updateCartItem: async (itemId: number, quantity: number) =>
    handleCart(await request("PATCH", `/cart/items/${itemId}`, { body: { quantity } })),
  removeCartItem: async (itemId: number) => handleCart(await request("DELETE", `/cart/items/${itemId}`)),
  applyCoupon: async (code: string) => handleCart(await request("POST", "/cart/coupon", { body: { code } })),
  removeCoupon: async () => handleCart(await request("DELETE", "/cart/coupon")),

  // ----- Checkout
  async checkout(input: CheckoutInput, idempotencyKey: string): Promise<Order> {
    const json = await request("POST", "/checkout", {
      headers: { "Idempotency-Key": idempotencyKey },
      body: {
        customer_name: input.customerName,
        email: input.email,
        phone: input.phone,
        shipping_address_id: input.shippingAddressId ?? null,
        shipping_address: input.shippingAddressId ? undefined : addressPayload(input.shippingAddress ?? {}),
        billing_same_as_shipping: input.billingSameAsShipping,
        billing_address: input.billingSameAsShipping ? undefined : addressPayload(input.billingAddress ?? {}),
        shipping_method: input.shippingMethod,
        payment_method: input.paymentMethod,
        customer_note: input.customerNote || null,
        save_address: input.saveAddress ?? false,
      },
    });
    return mapOrder(json);
  },

  // ----- Newsletter
  subscribe: (email: string) => request<{ message: string }>("POST", "/newsletter", { body: { email } }),

  // ----- Reviews
  async productReviews(slug: string, page = 1): Promise<ReviewPage> {
    const json = await request<{
      data: Record<string, unknown>[];
      meta: { current_page: number; last_page: number; total: number };
      summary: { average: number | null; count: number; distribution: Record<string, number> };
    }>("GET", `/products/${encodeURIComponent(slug)}/reviews?page=${page}`);
    return {
      reviews: json.data.map((r) => ({
        id: Number(r.id),
        name: String(r.name ?? ""),
        rating: Number(r.rating ?? 0),
        title: (r.title as string | null) ?? null,
        body: String(r.body ?? ""),
        isVerifiedBuyer: Boolean(r.is_verified_buyer),
        createdAt: (r.created_at as string | null) ?? null,
      })),
      page: json.meta.current_page,
      lastPage: json.meta.last_page,
      summary: {
        average: json.summary.average,
        count: json.summary.count,
        distribution: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: Number(json.summary.distribution[stars] ?? 0) })),
      },
    };
  },
  submitReview: (slug: string, input: ReviewInput) =>
    request<{ message: string }>("POST", `/products/${encodeURIComponent(slug)}/reviews`, {
      body: { name: input.name, email: input.email, rating: input.rating, title: input.title || null, body: input.body, website: input.website || null },
    }),

  // ----- Contact
  submitContact: (input: ContactInput) =>
    request<{ message: string }>("POST", "/contact", {
      body: {
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        subject: input.subject || null,
        message: input.message,
        website: input.website || null,
      },
    }),
};
