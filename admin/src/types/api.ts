/**
 * Response models returned by the Laravel admin API. Money values are major
 * units (rupees) unless a field name ends in `Minor` / the settings payload,
 * which uses minor units (paisa).
 */

export type Role = "admin" | "staff" | "customer";

export type PermissionKey =
  | "view-dashboard"
  | "manage-products"
  | "manage-categories"
  | "manage-orders"
  | "refund-orders"
  | "manage-inventory"
  | "view-customers"
  | "manage-customers"
  | "manage-coupons"
  | "manage-content"
  | "manage-messages"
  | "manage-settings";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  is_active: boolean;
  permissions?: PermissionKey[];
  created_at: string;
  last_login_at?: string | null;
  orders_count?: number;
  orders_total?: number;
  addresses?: Address[];
}

export interface Paginated<T> {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null };
}

export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  short_name: string;
  slug: string;
  description: string | null;
  image: string | null;
  image_path?: string | null;
  sort_order: number;
  is_active: boolean;
  meta_title: string | null;
  meta_description: string | null;
  products_count?: number;
  parent?: Category | null;
}

export interface ProductImage {
  id: number;
  url: string;
  alt: string | null;
  sort_order: number;
}

export interface Variant {
  id: number;
  sku: string;
  name: string;
  options: Record<string, string>;
  price: number | null;
  sale_price: number | null;
  price_override?: number | null;
  sale_price_override?: number | null;
  in_stock: boolean;
  stock?: number;
  is_active: boolean;
  sort_order: number;
}

export type ProductStatus = "draft" | "active" | "archived";

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  brand: string | null;
  short_description: string | null;
  description: string | null;
  details: string[];
  fabric: string | null;
  pieces: number | null;
  price: number;
  sale_price: number | null;
  sale_price_raw?: number | null;
  status: ProductStatus;
  is_featured: boolean;
  low_stock_threshold: number;
  sales_count?: number;
  total_stock?: number;
  image: string | null;
  images?: ProductImage[];
  category?: Category | null;
  variants?: Variant[];
  tags?: Tag[];
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled" | "refunded";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled";

export interface Address {
  id?: number;
  label?: string | null;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  province?: string | null;
  postal_code?: string | null;
  country: string;
}

export interface OrderItem {
  id: number;
  product_id: number | null;
  variant_id: number | null;
  name: string;
  variant_name: string | null;
  sku: string;
  image: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: number;
  number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  payment_method_label: string;
  shipping_method: string;
  customer_name: string;
  email: string;
  phone: string;
  shipping_address: Address;
  billing_address: Address;
  customer_note: string | null;
  coupon_code: string | null;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  grand_total: number;
  items_count?: number;
  items?: OrderItem[];
  status_history?: { from: OrderStatus | null; to: OrderStatus; note: string | null; by: string | null; at: string }[];
  shipment?: { carrier: string | null; tracking_number: string | null; tracking_url: string | null; shipped_at: string | null; delivered_at: string | null } | null;
  payments?: { id: number; method: string; status: PaymentStatus; amount: number; provider_reference: string | null; paid_at: string | null; refunded_at: string | null }[];
  allowed_transitions?: OrderStatus[];
  user?: { id: number; name: string; email: string } | null;
  placed_at: string;
  cancelled_at: string | null;
}

export interface InventoryRow {
  id: number;
  sku: string;
  name: string;
  stock: number;
  is_active: boolean;
  product_id: number;
  product_name: string;
  low_stock_threshold: number;
  is_low_stock: boolean;
}

export type InventoryReason = "initial_stock" | "restock" | "correction" | "damaged" | "sale" | "order_cancelled" | "return";

export interface InventoryMovement {
  id: number;
  variant_id: number;
  sku?: string;
  product_name?: string | null;
  quantity_change: number;
  stock_after: number;
  reason: InventoryReason;
  note: string | null;
  order_id: number | null;
  by?: string | null;
  created_at: string;
}

export type CouponType = "percentage" | "fixed";

export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  per_customer_limit: number | null;
  used_count: number;
  is_active: boolean;
  product_ids?: number[];
  category_ids?: number[];
}

export interface Banner {
  id: number;
  placement: "hero" | "promo";
  title: string;
  subtitle: string | null;
  image: string;
  mobile_image: string | null;
  image_path?: string;
  mobile_image_path?: string | null;
  buttons: { label: string; href: string }[];
  sort_order: number;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}

export type HomeSectionType =
  | "featured"
  | "best_sellers"
  | "latest"
  | "discounted"
  | "category"
  | "category_tabs"
  | "category_grid"
  | "reviews";

export interface HomeSection {
  id: number;
  type: HomeSectionType;
  title: string;
  category_id: number | null;
  category?: Category | null;
  product_limit: number;
  sort_order: number;
  is_active: boolean;
}

export interface CmsPage {
  id: number;
  slug: string;
  title: string;
  sections: { heading: string | null; body: string }[];
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  updated_at: string;
}

export interface DashboardData {
  totals: {
    revenue: number;
    orders: number;
    customers: number;
    products: number;
    pending_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    low_stock_variants: number;
  };
  status_counts: Partial<Record<OrderStatus, number>>;
  sales: { date: string; orders: number; revenue: number }[];
  best_sellers: { product_id: number; name: string; units: number; revenue: number }[];
  low_stock: { id: number; sku: string; name: string; stock: number; product_id: number; product_name: string; low_stock_threshold: number }[];
  recent_orders: { number: string; customer_name: string; email: string; status: OrderStatus; payment_status: PaymentStatus; grand_total: number; placed_at: string }[];
  revenue_definition: string;
}

/** Store settings (money values in minor units / paisa). */
export interface StoreSettings {
  store: {
    name: string;
    tagline: string | null;
    about: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    address: string | null;
    hours: string | null;
    /** Storage path of the uploaded logo (e.g. logos/abc.png). */
    logo: string | null;
    /** Read-only public URL derived from `logo` by the API. */
    logo_url: string | null;
    /** What the storefront header shows: the uploaded image or the store name as text. */
    logo_type: "text" | "image";
  };
  localization: { currency: string; currency_symbol: string; timezone: string };
  shipping: { free_shipping_threshold: number | null; methods: { code: string; name: string; fee: number; is_active: boolean }[] };
  tax: { rate_percent: number; prices_include_tax: boolean };
  payments: { cod_enabled: boolean; cod_max_order_amount: number | null };
  checkout: { allow_guest_checkout: boolean; max_quantity_per_item: number };
  social: { label: string; href: string }[];
  seo: { default_title: string | null; default_description: string | null; og_image: string | null };
  announcements: string[];
  navigation: { label: string; href: string }[];
  trust: { icon: "truck" | "shield" | "map" | "lock"; title: string; text: string }[];
  footer: {
    copyright: string | null;
    columns: { heading: string; links: { label: string; href: string }[] }[];
    /** Storage path of the uploaded footer logo (e.g. logos/abc.png). */
    logo: string | null;
    /** Read-only public URL derived from `logo` by the API. */
    logo_url: string | null;
  };
  inventory: { default_low_stock_threshold: number };
}

/** Storefront "Contact Us" form submission. */
export interface ContactMessage {
  id: number;
  user_id: number | null;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  read_at: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  products_count?: number;
}

/** Variant attribute (Color, Size…). `slug` is the key stored in variant options. */
export interface ProductAttribute {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  values: { id: number; value: string; sort_order: number }[];
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ProductReview {
  id: number;
  name: string;
  email: string | null;
  rating: number;
  title: string | null;
  body: string;
  status: ReviewStatus;
  is_verified_buyer: boolean;
  user_id: number | null;
  ip_address: string | null;
  product: { id: number; name: string; slug: string } | null;
  created_at: string;
  updated_at: string;
}
