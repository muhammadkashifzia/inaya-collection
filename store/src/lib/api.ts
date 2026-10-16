import type {
  Address,
  Cart,
  CartItem,
  CartIssue,
  Order,
  OrderItem,
  Paginated,
  PaginationMeta,
  Product,
  User,
  Variant,
} from "@/lib/types";

/* ── Base URL ── */

const BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "https://inaya-api.eastlogic.com").replace(
    /\/$/,
    "",
  );

/* ── Custom error ── */

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.status = status;
    this.errors = errors;
  }

  field(name: string): string | undefined {
    const key = Object.keys(this.errors).find(
      (k) => k === name || k.startsWith(`${name}.`),
    );
    return key ? this.errors[key][0] : undefined;
  }
}

/* ── Cookie / token helpers ── */

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(
    new RegExp("(?:^|;\\s*)" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

const CART_TOKEN_KEY = "gw-cart-token";

function getCartToken(): string | null {
  try {
    return localStorage.getItem(CART_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setCartToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(CART_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(CART_TOKEN_KEY);
    }
  } catch {
    /* SSR or private mode — silently ignore */
  }
}

/* ── CSRF ── */

let csrfPromise: Promise<void> | null = null;

async function ensureCsrf(force = false): Promise<void> {
  if (!force && csrfPromise) return csrfPromise;
  csrfPromise = fetch(`${BASE}/sanctum/csrf-cookie`, {
    credentials: "include",
  }).then(() => undefined);
  return csrfPromise;
}

/* ── Generic request ── */

interface RequestOptions {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, params, signal } = options;

  /* Build URL */
  let url = `${BASE}/api/v1${path}`;
  if (params) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
    }
    const qs = sp.toString();
    if (qs) url += `?${qs}`;
  }

  /* Ensure CSRF for mutating requests */
  if (method !== "GET") {
    await ensureCsrf();
  }

  /* Build headers */
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const xsrf = getCookie("XSRF-TOKEN");
  if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;

  const cartToken = getCartToken();
  if (cartToken) headers["X-Cart-Token"] = cartToken;

  /* Fetch */
  let res = await fetch(url, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  /* 419 CSRF mismatch — retry once */
  if (res.status === 419) {
    await ensureCsrf(true);
    const retryXsrf = getCookie("XSRF-TOKEN");
    if (retryXsrf) headers["X-XSRF-TOKEN"] = retryXsrf;
    res = await fetch(url, {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  }

  /* 429 rate limit */
  if (res.status === 429) {
    throw new ApiError("Too many requests. Please try again later.", 429);
  }

  /* 204 No Content */
  if (res.status === 204) return undefined as T;

  /* Parse response */
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      data?.message ?? res.statusText,
      res.status,
      data?.errors ?? {},
    );
  }

  return data as T;
}

/* ── Number coercion ── */

const num = (v: unknown): number =>
  typeof v === "number" ? v : Number(v ?? 0);

/* ── Data mappers ── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVariant(raw: any): Variant {
  return {
    id: num(raw.id),
    sku: raw.sku ?? "",
    name: raw.name ?? "",
    options: raw.options ?? {},
    price: num(raw.price),
    compareAtPrice: raw.compare_at_price != null ? num(raw.compare_at_price) : null,
    inStock: Boolean(raw.in_stock),
    lowStock: Boolean(raw.low_stock),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProduct(raw: any): Product {
  return {
    id: num(raw.id),
    slug: raw.slug ?? "",
    sku: raw.sku ?? "",
    title: raw.title ?? raw.name ?? "",
    brand: raw.brand ?? null,
    categorySlug: raw.category_slug ?? null,
    categoryName: raw.category_name ?? null,
    price: num(raw.price),
    compareAtPrice:
      raw.compare_at_price != null ? num(raw.compare_at_price) : null,
    discountPercent: num(raw.discount_percent),
    images: Array.isArray(raw.images) ? raw.images : [],
    inStock: Boolean(raw.in_stock),
    isAvailable: Boolean(raw.is_available),
    fabric: raw.fabric ?? null,
    pieces: raw.pieces != null ? num(raw.pieces) : null,
    details: Array.isArray(raw.details) ? raw.details : [],
    shortDescription: raw.short_description ?? null,
    description: raw.description ?? null,
    variants: Array.isArray(raw.variants)
      ? raw.variants.map(mapVariant)
      : [],
    defaultVariantId:
      raw.default_variant_id != null ? num(raw.default_variant_id) : null,
    variantsCount: num(raw.variants_count ?? raw.variants?.length ?? 0),
    metaTitle: raw.meta_title ?? null,
    metaDescription: raw.meta_description ?? null,
    publishedAt: raw.published_at ?? null,
    updatedAt: raw.updated_at ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCartItem(raw: any): CartItem {
  return {
    id: num(raw.id),
    variantId: num(raw.variant_id),
    productId: num(raw.product_id),
    slug: raw.slug ?? "",
    name: raw.name ?? "",
    variantName: raw.variant_name ?? null,
    sku: raw.sku ?? "",
    image: raw.image ?? null,
    unitPrice: num(raw.unit_price),
    regularPrice: num(raw.regular_price),
    quantity: num(raw.quantity),
    maxQuantity: num(raw.max_quantity),
    lineTotal: num(raw.line_total),
    inStock: Boolean(raw.in_stock),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCartIssue(raw: any): CartIssue {
  return {
    itemId: num(raw.item_id),
    message: raw.message ?? "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCart(raw: any): Cart {
  const token: string | null = raw.token ?? raw.cart_token ?? null;
  setCartToken(token);
  return {
    token,
    items: Array.isArray(raw.items) ? raw.items.map(mapCartItem) : [],
    issues: Array.isArray(raw.issues) ? raw.issues.map(mapCartIssue) : [],
    couponCode: raw.coupon_code ?? null,
    couponError: raw.coupon_error ?? null,
    itemCount: num(raw.item_count),
    subtotal: num(raw.subtotal),
    discountTotal: num(raw.discount_total),
    shippingTotal: num(raw.shipping_total),
    taxTotal: num(raw.tax_total),
    grandTotal: num(raw.grand_total),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUser(raw: any): User {
  return {
    id: num(raw.id),
    name: raw.name ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? null,
    role: raw.role ?? "customer",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAddress(raw: any): Address {
  return {
    id: num(raw.id),
    label: raw.label ?? null,
    fullName: raw.full_name ?? "",
    phone: raw.phone ?? "",
    line1: raw.line1 ?? raw.address_line1 ?? "",
    line2: raw.line2 ?? raw.address_line2 ?? null,
    city: raw.city ?? "",
    province: raw.province ?? raw.state ?? null,
    postalCode: raw.postal_code ?? raw.zip ?? null,
    country: raw.country ?? "PK",
    isDefaultShipping: Boolean(raw.is_default_shipping),
    isDefaultBilling: Boolean(raw.is_default_billing),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOrderItem(raw: any): OrderItem {
  return {
    id: num(raw.id),
    name: raw.name ?? "",
    variantName: raw.variant_name ?? null,
    sku: raw.sku ?? "",
    image: raw.image ?? null,
    unitPrice: num(raw.unit_price),
    quantity: num(raw.quantity),
    lineTotal: num(raw.line_total),
    productId: raw.product_id != null ? num(raw.product_id) : null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOrder(raw: any): Order {
  return {
    number: raw.number ?? raw.order_number ?? "",
    status: raw.status ?? "",
    paymentStatus: raw.payment_status ?? "",
    paymentMethodLabel: raw.payment_method_label ?? raw.payment_method ?? "",
    shippingMethod: raw.shipping_method ?? "",
    customerName: raw.customer_name ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    shippingAddress: raw.shipping_address ?? "",
    subtotal: num(raw.subtotal),
    discountTotal: num(raw.discount_total),
    shippingTotal: num(raw.shipping_total),
    taxTotal: num(raw.tax_total),
    grandTotal: num(raw.grand_total),
    couponCode: raw.coupon_code ?? null,
    itemsCount: raw.items_count != null ? num(raw.items_count) : null,
    items: Array.isArray(raw.items) ? raw.items.map(mapOrderItem) : [],
    statusHistory: Array.isArray(raw.status_history)
      ? raw.status_history
      : [],
    shipment: raw.shipment
      ? {
          carrier: raw.shipment.carrier ?? "",
          trackingNumber: raw.shipment.tracking_number ?? "",
          trackingUrl: raw.shipment.tracking_url ?? "",
          shippedAt: raw.shipment.shipped_at ?? "",
          deliveredAt: raw.shipment.delivered_at ?? "",
        }
      : null,
    canCancel: Boolean(raw.can_cancel),
    placedAt: raw.placed_at ?? raw.created_at ?? "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPaginationMeta(raw: any): PaginationMeta {
  return {
    currentPage: num(raw.current_page),
    lastPage: num(raw.last_page),
    perPage: num(raw.per_page),
    total: num(raw.total),
  };
}

function mapPaginated<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any,
  mapper: (item: unknown) => T,
): Paginated<T> {
  return {
    data: Array.isArray(raw.data) ? raw.data.map(mapper) : [],
    meta: mapPaginationMeta(raw.meta ?? raw),
  };
}

/* ── Address payload helper ── */

function addressToPayload(
  addr: Partial<Address>,
): Record<string, unknown> {
  return {
    label: addr.label,
    full_name: addr.fullName,
    phone: addr.phone,
    line1: addr.line1,
    line2: addr.line2,
    city: addr.city,
    province: addr.province,
    postal_code: addr.postalCode,
    country: addr.country,
    is_default_shipping: addr.isDefaultShipping,
    is_default_billing: addr.isDefaultBilling,
  };
}

/* ── Public API ── */

export const api = {
  /* ── Auth ── */

  async me(): Promise<User | null> {
    try {
      const raw = await request<{ data: unknown }>("GET", "/me");
      return mapUser(raw.data ?? raw);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        return null;
      }
      throw err;
    }
  },

  async login(
    email: string,
    password: string,
    remember = false,
  ): Promise<User> {
    const raw = await request<{ data: unknown }>("POST", "/auth/login", {
      body: {
        email,
        password,
        remember,
        cart_token: getCartToken(),
      },
    });
    setCartToken(null);
    return mapUser(raw.data ?? raw);
  },

  async register(data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    passwordConfirmation: string;
  }): Promise<User> {
    const raw = await request<{ data: unknown }>("POST", "/auth/register", {
      body: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        password_confirmation: data.passwordConfirmation,
        cart_token: getCartToken(),
      },
    });
    setCartToken(null);
    return mapUser(raw.data ?? raw);
  },

  async logout(): Promise<void> {
    await request("POST", "/auth/logout");
  },

  async forgotPassword(email: string): Promise<void> {
    await request("POST", "/auth/forgot-password", { body: { email } });
  },

  async resetPassword(data: {
    token: string;
    email: string;
    password: string;
    passwordConfirmation: string;
  }): Promise<void> {
    await request("POST", "/auth/reset-password", {
      body: {
        token: data.token,
        email: data.email,
        password: data.password,
        password_confirmation: data.passwordConfirmation,
      },
    });
  },

  /* ── Profile ── */

  async updateProfile(data: Partial<User>): Promise<User> {
    const raw = await request<{ data: unknown }>("PUT", "/me", {
      body: data,
    });
    return mapUser(raw.data ?? raw);
  },

  async updatePassword(data: {
    currentPassword: string;
    password: string;
    passwordConfirmation: string;
  }): Promise<void> {
    await request("PUT", "/me/password", {
      body: {
        current_password: data.currentPassword,
        password: data.password,
        password_confirmation: data.passwordConfirmation,
      },
    });
  },

  /* ── Addresses ── */

  async addresses(): Promise<Address[]> {
    const raw = await request<{ data: unknown[] }>("GET", "/me/addresses");
    return (raw.data ?? []).map(mapAddress);
  },

  async createAddress(data: Partial<Address>): Promise<Address> {
    const raw = await request<{ data: unknown }>("POST", "/me/addresses", {
      body: addressToPayload(data),
    });
    return mapAddress(raw.data ?? raw);
  },

  async updateAddress(id: number, data: Partial<Address>): Promise<Address> {
    const raw = await request<{ data: unknown }>(
      "PUT",
      `/me/addresses/${id}`,
      { body: addressToPayload(data) },
    );
    return mapAddress(raw.data ?? raw);
  },

  async deleteAddress(id: number): Promise<void> {
    await request("DELETE", `/me/addresses/${id}`);
  },

  /* ── Orders ── */

  async orders(page = 1): Promise<Paginated<Order>> {
    const raw = await request<unknown>("GET", "/me/orders", {
      params: { page },
    });
    return mapPaginated(raw, mapOrder);
  },

  async order(number: string): Promise<Order> {
    const raw = await request<{ data: unknown }>(
      "GET",
      `/me/orders/${number}`,
    );
    return mapOrder(raw.data ?? raw);
  },

  async cancelOrder(number: string): Promise<Order> {
    const raw = await request<{ data: unknown }>(
      "POST",
      `/me/orders/${number}/cancel`,
    );
    return mapOrder(raw.data ?? raw);
  },

  async trackOrder(number: string, contact: string): Promise<Order> {
    const raw = await request<{ data: unknown }>("POST", "/orders/track", {
      body: { number, contact },
    });
    return mapOrder(raw.data ?? raw);
  },

  /* ── Wishlist ── */

  async wishlist(): Promise<{ products: Product[]; ids: number[] }> {
    const raw = await request<{ data: { products: unknown[]; ids: number[] } }>(
      "GET",
      "/me/wishlist",
    );
    const d = raw.data ?? raw;
    return {
      products: Array.isArray(d.products)
        ? d.products.map(mapProduct)
        : [],
      ids: Array.isArray(d.ids) ? d.ids.map(Number) : [],
    };
  },

  async addToWishlist(productId: number): Promise<void> {
    await request("POST", "/me/wishlist", {
      body: { product_id: productId },
    });
  },

  async removeFromWishlist(productId: number): Promise<void> {
    await request("DELETE", `/me/wishlist/${productId}`);
  },

  /* ── Products ── */

  async products(
    params: {
      q?: string;
      perPage?: number;
      page?: number;
      sort?: string;
    } = {},
    signal?: AbortSignal,
  ): Promise<Paginated<Product>> {
    const raw = await request<unknown>("GET", "/products", {
      params: {
        q: params.q,
        per_page: params.perPage,
        page: params.page,
        sort: params.sort,
      },
      signal,
    });
    return mapPaginated(raw, mapProduct);
  },

  /* ── Cart ── */

  async cart(shippingMethod?: string): Promise<Cart> {
    const raw = await request<{ data: unknown }>("GET", "/cart", {
      params: { shipping_method: shippingMethod },
    });
    return mapCart(raw.data ?? raw);
  },

  async addToCart(variantId: number, quantity = 1): Promise<Cart> {
    const raw = await request<{ data: unknown }>("POST", "/cart/items", {
      body: { variant_id: variantId, quantity },
    });
    return mapCart(raw.data ?? raw);
  },

  async updateCartItem(id: number, quantity: number): Promise<Cart> {
    const raw = await request<{ data: unknown }>(
      "PATCH",
      `/cart/items/${id}`,
      { body: { quantity } },
    );
    return mapCart(raw.data ?? raw);
  },

  async removeCartItem(id: number): Promise<Cart> {
    const raw = await request<{ data: unknown }>(
      "DELETE",
      `/cart/items/${id}`,
    );
    return mapCart(raw.data ?? raw);
  },

  async applyCoupon(code: string): Promise<Cart> {
    const raw = await request<{ data: unknown }>("POST", "/cart/coupon", {
      body: { code },
    });
    return mapCart(raw.data ?? raw);
  },

  async removeCoupon(): Promise<Cart> {
    const raw = await request<{ data: unknown }>("DELETE", "/cart/coupon");
    return mapCart(raw.data ?? raw);
  },

  /* ── Checkout ── */

  async checkout(
    data: Record<string, unknown>,
    idempotencyKey: string,
  ): Promise<Order> {
    const raw = await request<{ data: unknown }>("POST", "/checkout", {
      body: { ...data, idempotency_key: idempotencyKey },
    });
    return mapOrder(raw.data ?? raw);
  },

  /* ── Newsletter ── */

  async subscribe(email: string): Promise<void> {
    await request("POST", "/newsletter", { body: { email } });
  },
};
