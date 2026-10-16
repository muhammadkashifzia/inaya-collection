/* ── Core data models ── */

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
  price: number;
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
  defaultVariantId: number | null;
  variantsCount: number;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
}

export interface Category {
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
  children: Category[];
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  image: string;
  mobileImage: string | null;
  buttons: { label: string; href: string }[];
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

export interface CartItem {
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

export interface CartIssue {
  itemId: number;
  message: string;
}

export interface Cart {
  token: string | null;
  items: CartItem[];
  issues: CartIssue[];
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
  role: string;
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

export interface Order {
  number: string;
  status: string;
  paymentStatus: string;
  paymentMethodLabel: string;
  shippingMethod: string;
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  couponCode: string | null;
  itemsCount: number | null;
  items: OrderItem[];
  statusHistory: unknown[];
  shipment: {
    carrier: string;
    trackingNumber: string;
    trackingUrl: string;
    shippedAt: string;
    deliveredAt: string;
  } | null;
  canCancel: boolean;
  placedAt: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface TrustItem {
  icon: string;
  title: string;
  text: string;
}

export interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

export interface SiteSettings {
  name: string;
  tagline: string;
  about: string;
  email: string | null;
  phone: string | null;
  hours: string | null;
  currencySymbol: string;
  announcements: string[];
  freeShippingThreshold: number | null;
  shippingMethods: { code: string; name: string; fee: number }[];
  paymentMethods: { code: string; name: string }[];
  allowGuestCheckout: boolean;
  maxQuantityPerItem: number;
  navigation: NavItem[];
  trust: TrustItem[];
  footer: { columns: FooterColumn[]; copyright: string };
  social: { href: string; label: string }[];
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    ogImage: string | null;
  };
}

export interface Review {
  id: number;
  name: string;
  title: string;
  quote: string;
  rating: number;
  image: string | null;
  date: string | null;
  verified: boolean;
}

export interface HomeSection {
  id: number;
  type: string;
  title: string;
  categories?: Category[];
  tabs?: { category: Category; total: number; products: Product[] }[];
  category?: Category | null;
  products?: Product[];
}

export interface HomeData {
  banners: Banner[];
  promos: Banner[];
  sections: HomeSection[];
  reviews: Review[];
}

export interface StaticPage {
  title: string;
  sections: { heading: string | null; body: string }[];
}

export interface Facets {
  price: { min: number; max: number };
  fabrics: string[];
  pieces: number[];
}
