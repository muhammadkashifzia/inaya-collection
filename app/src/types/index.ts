/**
 * Storefront domain types. Amounts are in major units (rupees), as returned by the API.
 */

export interface Variant {
  id: number;
  sku: string;
  name: string;
  options: Record<string, string>;
  price: number;
  compareAtPrice: number | null;
  inStock: boolean;
  lowStock: boolean;
}

export interface Product {
  id: number;
  slug: string;
  sku: string;
  title: string;
  brand: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  /** Price the customer pays (sale price when on sale). */
  price: number;
  /** Regular price, only set when the product is on sale. */
  compareAtPrice: number | null;
  discountPercent: number;
  images: string[];
  inStock: boolean;
  isAvailable: boolean;
  fabric: string | null;
  pieces: number | null;
  details: string[];
  shortDescription: string | null;
  description: string | null;
  variants: Variant[];
  /** Best variant to add from a card (in stock first). */
  defaultVariantId: number | null;
  variantsCount: number;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
}

export interface Collection {
  id: number;
  slug: string;
  title: string;
  shortTitle: string;
  rank: number;
  image: string | null;
  description: string | null;
  productCount: number;
  metaTitle: string | null;
  metaDescription: string | null;
  children: Collection[];
}

export interface PaginationMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface NavLink {
  label: string;
  href: string;
}

export type TrustIconName = "truck" | "shield" | "map" | "lock" | "user";

export interface TrustItem {
  icon: TrustIconName;
  title: string;
  text: string;
}

export interface FooterColumn {
  heading: string;
  links: NavLink[];
}

export interface ShippingMethod {
  code: string;
  name: string;
  fee: number;
}

export interface SiteConfig {
  name: string;
  /** Header branding chosen in admin: uploaded/default image, or the store name as text. */
  logoType: "text" | "image";
  /** Uploaded logo URL; null means use the bundled default logo. */
  logoUrl: string | null;
  tagline: string;
  about: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  hours: string | null;
  currencySymbol: string;
  announcements: string[];
  freeShippingThreshold: number | null;
  shippingMethods: ShippingMethod[];
  paymentMethods: { code: string; name: string }[];
  allowGuestCheckout: boolean;
  maxQuantityPerItem: number;
  navigation: NavLink[];
  trust: TrustItem[];
  /** logoUrl: uploaded footer logo; null shows the store name as text. */
  footer: { columns: FooterColumn[]; copyright: string; logoUrl: string | null };
  social: NavLink[];
  seo: { defaultTitle: string; defaultDescription: string; ogImage: string | null };
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  image: string;
  mobileImage: string | null;
  buttons: NavLink[];
}

export type HomeSection =
  | { id: number; type: "category_grid"; title: string; categories: Collection[] }
  | { id: number; type: "category_tabs"; title: string; tabs: { category: Collection; total: number; products: Product[] }[] }
  | { id: number; type: "featured" | "best_sellers" | "latest" | "discounted"; title: string; products: Product[] }
  | { id: number; type: "category"; title: string; category: Collection | null; products: Product[] }
  | { id: number; type: "reviews"; title: string };

export interface HomeData {
  banners: Banner[];
  promos: Banner[];
  sections: HomeSection[];
}

export interface ContentPage {
  slug: string;
  title: string;
  sections: { heading?: string | null; body: string }[];
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string | null;
}

export type SortOption = "featured" | "latest" | "price_asc" | "price_desc" | "popularity" | "name";

export interface ProductQuery {
  category?: string;
  q?: string;
  sort?: SortOption;
  page?: number;
  perPage?: number;
  minPrice?: number;
  maxPrice?: number;
  availability?: "in_stock" | "out_of_stock";
  onSale?: boolean;
  fabric?: string[];
  pieces?: number;
}

export interface Facets {
  fabrics: string[];
  pieces: number[];
  brands: string[];
  price: { min: number; max: number };
}

// ----- Cart / checkout / account -----

export interface CartLine {
  id: number;
  variantId: number;
  productId: number;
  slug: string;
  name: string;
  variantName: string | null;
  sku: string;
  image: string | null;
  unitPrice: number;
  regularPrice: number;
  quantity: number;
  maxQuantity: number;
  lineTotal: number;
  inStock: boolean;
}

export interface Cart {
  token: string | null;
  items: CartLine[];
  issues: { itemId: number; message: string }[];
  couponCode: string | null;
  couponError: string | null;
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "admin" | "staff" | "customer";
}

export interface Address {
  id: number;
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string | null;
  postalCode: string | null;
  country: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export type AddressInput = Omit<Address, "id" | "isDefaultShipping" | "isDefaultBilling"> & {
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
};

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled" | "refunded";

export interface OrderItem {
  id: number;
  name: string;
  variantName: string | null;
  sku: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  productId: number | null;
}

export interface OrderAddress {
  full_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  province?: string | null;
  postal_code?: string | null;
  country: string;
}

export interface Order {
  number: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethodLabel: string;
  shippingMethod: string;
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: OrderAddress;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  couponCode: string | null;
  itemsCount: number | null;
  items: OrderItem[];
  statusHistory: { from: OrderStatus | null; to: OrderStatus; note: string | null; at: string }[];
  shipment: { carrier: string | null; trackingNumber: string | null; trackingUrl: string | null; shippedAt: string | null; deliveredAt: string | null } | null;
  canCancel: boolean;
  placedAt: string;
}

export interface CheckoutInput {
  customerName: string;
  email: string;
  phone: string;
  shippingAddressId?: number | null;
  shippingAddress?: Omit<AddressInput, "label">;
  billingSameAsShipping: boolean;
  billingAddress?: Omit<AddressInput, "label">;
  shippingMethod: string;
  paymentMethod: string;
  customerNote?: string;
  saveAddress?: boolean;
}

/** Storefront "Contact Us" form payload. `website` is a spam honeypot and must stay empty. */
export interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  website?: string;
}

export interface ProductReview {
  id: number;
  name: string;
  rating: number;
  title: string | null;
  body: string;
  isVerifiedBuyer: boolean;
  createdAt: string | null;
}

export interface ReviewPage {
  reviews: ProductReview[];
  page: number;
  lastPage: number;
  summary: { average: number | null; count: number; distribution: { stars: number; count: number }[] };
}

/** Storefront review form payload. `website` is a spam honeypot and must stay empty. */
export interface ReviewInput {
  name: string;
  email: string;
  rating: number;
  title?: string;
  body: string;
  website?: string;
}
