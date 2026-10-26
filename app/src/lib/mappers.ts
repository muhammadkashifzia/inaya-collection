/**
 * Pure functions that convert Laravel API JSON (snake_case) into storefront
 * types (camelCase). Shared by the server data layer and the browser client.
 */
import type {
  Address,
  Banner,
  Cart,
  Collection,
  ContentPage,
  HomeData,
  HomeSection,
  Order,
  Paginated,
  Product,
  SiteConfig,
  User,
  Variant,
} from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any -- raw API payloads */
type Raw = any;

const num = (v: unknown): number => (typeof v === "number" ? v : Number(v ?? 0));

export function mapVariant(v: Raw): Variant {
  const regular = num(v.price);
  const sale = v.sale_price != null ? num(v.sale_price) : null;
  return {
    id: v.id,
    sku: v.sku,
    name: v.name,
    options: v.options && !Array.isArray(v.options) ? v.options : {},
    price: sale ?? regular,
    compareAtPrice: sale != null ? regular : null,
    inStock: Boolean(v.in_stock),
    lowStock: Boolean(v.low_stock),
  };
}

export function mapProduct(p: Raw): Product {
  const regular = num(p.price);
  const sale = p.sale_price != null ? num(p.sale_price) : null;
  const images: string[] = Array.isArray(p.images) && p.images.length
    ? p.images.map((i: Raw) => i.url)
    : p.image
      ? [p.image]
      : [];

  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    title: p.name,
    brand: p.brand ?? null,
    categorySlug: p.category?.slug ?? null,
    categoryName: p.category?.name ?? null,
    price: sale ?? regular,
    compareAtPrice: sale != null ? regular : null,
    discountPercent: num(p.discount_percent),
    images,
    inStock: Boolean(p.in_stock),
    isAvailable: Boolean(p.is_available ?? p.in_stock),
    fabric: p.fabric ?? null,
    pieces: p.pieces ?? null,
    details: Array.isArray(p.details) ? p.details : [],
    shortDescription: p.short_description ?? null,
    description: p.description ?? null,
    variants: Array.isArray(p.variants) ? p.variants.map(mapVariant) : [],
    defaultVariantId: p.default_variant_id ?? null,
    variantsCount: num(p.variants_count),
    metaTitle: p.meta_title ?? null,
    metaDescription: p.meta_description ?? null,
    publishedAt: p.published_at ?? null,
    updatedAt: p.updated_at ?? null,
  };
}

export function mapCollection(c: Raw): Collection {
  return {
    id: c.id,
    slug: c.slug,
    title: c.name,
    shortTitle: c.short_name ?? c.name,
    rank: num(c.sort_order),
    image: c.image ?? null,
    description: c.description ?? null,
    productCount: num(c.products_count),
    metaTitle: c.meta_title ?? null,
    metaDescription: c.meta_description ?? null,
    children: Array.isArray(c.children) ? c.children.map(mapCollection) : [],
  };
}

export function mapPaginated<T>(json: Raw, map: (row: Raw) => T): Paginated<T> {
  return {
    data: (json.data ?? []).map(map),
    meta: {
      currentPage: num(json.meta?.current_page ?? 1),
      lastPage: num(json.meta?.last_page ?? 1),
      perPage: num(json.meta?.per_page ?? 0),
      total: num(json.meta?.total ?? 0),
    },
  };
}

export function mapBanner(b: Raw): Banner {
  return {
    id: b.id,
    title: b.title,
    subtitle: b.subtitle ?? null,
    image: b.image,
    mobileImage: b.mobile_image ?? null,
    buttons: Array.isArray(b.buttons) ? b.buttons : [],
  };
}

export function mapHome(json: Raw): HomeData {
  const sections: HomeSection[] = (json.sections ?? []).map((s: Raw): HomeSection => {
    switch (s.type) {
      case "category_grid":
        return { id: s.id, type: s.type, title: s.title, subtitle: s.subtitle ?? null, categories: (s.categories ?? []).map(mapCollection) };
      case "category_tabs":
        return {
          id: s.id,
          type: s.type,
          title: s.title,
          subtitle: s.subtitle ?? null,
          tabs: (s.tabs ?? []).map((t: Raw) => ({
            category: mapCollection(t.category),
            total: num(t.total),
            products: (t.products ?? []).map(mapProduct),
          })),
        };
      case "category":
        return {
          id: s.id,
          type: s.type,
          title: s.title,
          subtitle: s.subtitle ?? null,
          category: s.category ? mapCollection(s.category) : null,
          products: (s.products ?? []).map(mapProduct),
        };
      case "reviews":
        return { id: s.id, type: s.type, title: s.title, subtitle: s.subtitle ?? null };
      case "shop_the_look":
        return {
          id: s.id,
          type: s.type,
          title: s.title,
          subtitle: s.subtitle ?? null,
          looks: (s.looks ?? []).map((l: Raw) => ({
            image: l.image ?? "",
            products: (l.products ?? []).map(mapProduct),
          })),
        };
      case "banner_image":
        return {
          id: s.id,
          type: s.type,
          title: s.title,
          subtitle: s.subtitle ?? null,
          button_text: s.button_text ?? null,
          button_link: s.button_link ?? null,
          image: s.image ?? null,
          slides: (s.slides ?? []).map((sl: Raw) => ({
            image: sl.image ?? null,
            text: sl.text ?? null,
            link: sl.link ?? null,
          })),
        };
      default:
        return { id: s.id, type: s.type, title: s.title, subtitle: s.subtitle ?? null, products: (s.products ?? []).map(mapProduct) };
    }
  });

  return {
    banners: (json.banners ?? []).map(mapBanner),
    promos: (json.promos ?? []).map(mapBanner),
    collectionStrip: (json.collection_strip ?? []).map(mapBanner),
    sections,
  };
}

export function mapSettings(s: Raw): SiteConfig {
  const minorToMajor = (v: unknown) => (v == null ? null : num(v) / 100);
  return {
    name: s.store?.name ?? "Store",
    logoType: s.store?.logo_type === "text" ? "text" : "image",
    logoUrl: s.store?.logo_url ?? null,
    tagline: s.store?.tagline ?? "",
    about: s.store?.about ?? "",
    email: s.store?.email ?? null,
    phone: s.store?.phone ?? null,
    whatsapp: s.store?.whatsapp ?? null,
    address: s.store?.address ?? null,
    hours: s.store?.hours ?? null,
    currencySymbol: s.localization?.currency_symbol ?? "Rs.",
    announcements: s.announcements ?? [],
    freeShippingThreshold: minorToMajor(s.shipping?.free_shipping_threshold),
    shippingMethods: (s.shipping?.methods ?? []).map((m: Raw) => ({ code: m.code, name: m.name, fee: num(m.fee) / 100 })),
    paymentMethods: s.payments?.methods ?? [],
    allowGuestCheckout: Boolean(s.checkout?.allow_guest_checkout ?? true),
    maxQuantityPerItem: num(s.checkout?.max_quantity_per_item ?? 10),
    navigation: s.navigation ?? [],
    trust: s.trust ?? [],
    footer: { columns: s.footer?.columns ?? [], copyright: s.footer?.copyright ?? "", logoUrl: s.footer?.logo_url ?? null },
    social: s.social ?? [],
    seo: {
      defaultTitle: s.seo?.default_title ?? s.store?.name ?? "",
      defaultDescription: s.seo?.default_description ?? "",
      ogImage: s.seo?.og_image ?? null,
    },
  };
}

export function mapPage(p: Raw): ContentPage {
  return {
    slug: p.slug,
    title: p.title,
    sections: Array.isArray(p.sections) ? p.sections : [],
    metaTitle: p.meta_title ?? null,
    metaDescription: p.meta_description ?? null,
    updatedAt: p.updated_at ?? null,
  };
}

export function mapCart(c: Raw): Cart {
  return {
    token: c.token ?? null,
    items: (c.items ?? []).map((i: Raw) => ({
      id: i.id,
      variantId: i.variant_id,
      productId: i.product_id,
      slug: i.slug,
      name: i.name,
      variantName: i.variant_name ?? null,
      sku: i.sku,
      image: i.image ?? null,
      unitPrice: num(i.unit_price),
      regularPrice: num(i.regular_price),
      quantity: num(i.quantity),
      maxQuantity: num(i.max_quantity),
      lineTotal: num(i.line_total),
      inStock: Boolean(i.in_stock),
    })),
    issues: (c.issues ?? []).map((x: Raw) => ({ itemId: x.item_id, message: x.message })),
    couponCode: c.coupon_code ?? null,
    couponError: c.coupon_error ?? null,
    itemCount: num(c.item_count),
    subtotal: num(c.subtotal),
    discountTotal: num(c.discount_total),
    shippingTotal: num(c.shipping_total),
    taxTotal: num(c.tax_total),
    grandTotal: num(c.grand_total),
  };
}

export function mapUser(u: Raw): User {
  return { id: u.id, name: u.name, email: u.email, phone: u.phone ?? null, role: u.role };
}

export function mapAddress(a: Raw): Address {
  return {
    id: a.id,
    label: a.label ?? null,
    fullName: a.full_name,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 ?? null,
    city: a.city,
    province: a.province ?? null,
    postalCode: a.postal_code ?? null,
    country: a.country ?? "PK",
    isDefaultShipping: Boolean(a.is_default_shipping),
    isDefaultBilling: Boolean(a.is_default_billing),
  };
}

export function mapOrder(o: Raw): Order {
  return {
    number: o.number,
    status: o.status,
    paymentStatus: o.payment_status,
    paymentMethodLabel: o.payment_method_label ?? o.payment_method,
    shippingMethod: o.shipping_method,
    customerName: o.customer_name,
    email: o.email,
    phone: o.phone,
    shippingAddress: o.shipping_address,
    subtotal: num(o.subtotal),
    discountTotal: num(o.discount_total),
    shippingTotal: num(o.shipping_total),
    taxTotal: num(o.tax_total),
    grandTotal: num(o.grand_total),
    couponCode: o.coupon_code ?? null,
    itemsCount: o.items_count ?? null,
    items: (o.items ?? []).map((i: Raw) => ({
      id: i.id,
      name: i.name,
      variantName: i.variant_name ?? null,
      sku: i.sku,
      image: i.image ?? null,
      unitPrice: num(i.unit_price),
      quantity: num(i.quantity),
      lineTotal: num(i.line_total),
      productId: i.product_id ?? null,
    })),
    statusHistory: o.status_history ?? [],
    shipment: o.shipment
      ? {
          carrier: o.shipment.carrier,
          trackingNumber: o.shipment.tracking_number,
          trackingUrl: o.shipment.tracking_url,
          shippedAt: o.shipment.shipped_at,
          deliveredAt: o.shipment.delivered_at,
        }
      : null,
    canCancel: Boolean(o.can_cancel),
    placedAt: o.placed_at,
  };
}
