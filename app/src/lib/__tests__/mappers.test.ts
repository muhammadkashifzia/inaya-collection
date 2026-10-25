import { describe, it, expect } from "vitest";
import {
  mapVariant,
  mapProduct,
  mapCollection,
  mapPaginated,
  mapBanner,
  mapCart,
  mapUser,
  mapAddress,
  mapOrder,
  mapPage,
  mapSettings,
  mapHome,
} from "@/lib/mappers";

/* ------------------------------------------------------------------ */
/*  mapVariant                                                         */
/* ------------------------------------------------------------------ */
describe("mapVariant", () => {
  it("maps a regular-priced variant", () => {
    const v = mapVariant({ id: 1, sku: "V-001", name: "Size M", options: { size: "M" }, price: 1000, sale_price: null, in_stock: true, low_stock: false });
    expect(v).toEqual({
      id: 1,
      sku: "V-001",
      name: "Size M",
      options: { size: "M" },
      price: 1000,
      compareAtPrice: null,
      inStock: true,
      lowStock: false,
    });
  });

  it("maps a sale variant — sale_price becomes price, regular becomes compareAtPrice", () => {
    const v = mapVariant({ id: 2, sku: "V-002", name: "Size L", options: {}, price: 2000, sale_price: 1500, in_stock: true, low_stock: true });
    expect(v.price).toBe(1500);
    expect(v.compareAtPrice).toBe(2000);
    expect(v.lowStock).toBe(true);
  });

  it("defaults options to empty object when options is an array", () => {
    const v = mapVariant({ id: 3, sku: "V-003", name: "X", options: [], price: 100 });
    expect(v.options).toEqual({});
  });

  it("coerces price from string", () => {
    const v = mapVariant({ id: 4, sku: "V-004", name: "X", price: "500" });
    expect(v.price).toBe(500);
  });
});

/* ------------------------------------------------------------------ */
/*  mapProduct                                                         */
/* ------------------------------------------------------------------ */
describe("mapProduct", () => {
  const rawProduct = {
    id: 10,
    slug: "black-abaya",
    sku: "BA-001",
    name: "Black Abaya",
    brand: "Inaya",
    category: { slug: "abayas", name: "Abayas" },
    price: 5000,
    sale_price: 3500,
    discount_percent: 30,
    images: [{ url: "https://cdn.com/1.jpg" }, { url: "https://cdn.com/2.jpg" }],
    in_stock: true,
    is_available: true,
    fabric: "Chiffon",
    pieces: 2,
    details: ["Detail 1"],
    short_description: "Short desc",
    description: "Full desc",
    variants: [],
    default_variant_id: 5,
    variants_count: 3,
    meta_title: "Meta Title",
    meta_description: "Meta Desc",
    published_at: "2024-01-01",
    updated_at: "2024-06-01",
  };

  it("maps snake_case to camelCase correctly", () => {
    const p = mapProduct(rawProduct);
    expect(p.id).toBe(10);
    expect(p.slug).toBe("black-abaya");
    expect(p.title).toBe("Black Abaya");
    expect(p.categorySlug).toBe("abayas");
    expect(p.categoryName).toBe("Abayas");
    expect(p.fabric).toBe("Chiffon");
    expect(p.pieces).toBe(2);
    expect(p.defaultVariantId).toBe(5);
    expect(p.variantsCount).toBe(3);
    expect(p.metaTitle).toBe("Meta Title");
    expect(p.metaDescription).toBe("Meta Desc");
  });

  it("handles sale price — sale_price becomes price, regular becomes compareAtPrice", () => {
    const p = mapProduct(rawProduct);
    expect(p.price).toBe(3500);
    expect(p.compareAtPrice).toBe(5000);
  });

  it("extracts image URLs from images array of objects", () => {
    const p = mapProduct(rawProduct);
    expect(p.images).toEqual(["https://cdn.com/1.jpg", "https://cdn.com/2.jpg"]);
  });

  it("falls back to single image field", () => {
    const p = mapProduct({ ...rawProduct, images: [], image: "https://cdn.com/fallback.jpg" });
    expect(p.images).toEqual(["https://cdn.com/fallback.jpg"]);
  });

  it("returns empty images array when no images", () => {
    const p = mapProduct({ ...rawProduct, images: null, image: null });
    expect(p.images).toEqual([]);
  });

  it("handles missing category", () => {
    const p = mapProduct({ ...rawProduct, category: null });
    expect(p.categorySlug).toBeNull();
    expect(p.categoryName).toBeNull();
  });

  it("maps variants array", () => {
    const withVariants = { ...rawProduct, variants: [{ id: 1, sku: "V1", name: "S", price: 100 }] };
    const p = mapProduct(withVariants);
    expect(p.variants).toHaveLength(1);
    expect(p.variants[0].sku).toBe("V1");
  });
});

/* ------------------------------------------------------------------ */
/*  mapCollection                                                      */
/* ------------------------------------------------------------------ */
describe("mapCollection", () => {
  it("maps a collection with children", () => {
    const raw = {
      id: 1,
      slug: "winter",
      name: "Winter Collection",
      short_name: "Winter",
      sort_order: 2,
      image: "https://cdn.com/winter.jpg",
      description: "Winter items",
      products_count: 15,
      meta_title: "Winter",
      meta_description: "Winter desc",
      children: [{ id: 2, slug: "jackets", name: "Jackets", sort_order: 1, products_count: 5 }],
    };
    const c = mapCollection(raw);
    expect(c.title).toBe("Winter Collection");
    expect(c.shortTitle).toBe("Winter");
    expect(c.rank).toBe(2);
    expect(c.children).toHaveLength(1);
    expect(c.children[0].slug).toBe("jackets");
  });

  it("uses name as shortTitle when short_name is missing", () => {
    const c = mapCollection({ id: 1, slug: "s", name: "Summer", products_count: 0 });
    expect(c.shortTitle).toBe("Summer");
  });
});

/* ------------------------------------------------------------------ */
/*  mapPaginated                                                       */
/* ------------------------------------------------------------------ */
describe("mapPaginated", () => {
  it("maps paginated response with meta", () => {
    const raw = {
      data: [{ value: 1 }, { value: 2 }],
      meta: { current_page: 2, last_page: 5, per_page: 10, total: 50 },
    };
    const result = mapPaginated(raw, (row) => ({ doubled: row.value * 2 }));
    expect(result.data).toEqual([{ doubled: 2 }, { doubled: 4 }]);
    expect(result.meta.currentPage).toBe(2);
    expect(result.meta.lastPage).toBe(5);
    expect(result.meta.perPage).toBe(10);
    expect(result.meta.total).toBe(50);
  });

  it("handles missing data and meta gracefully", () => {
    const result = mapPaginated({}, (row) => row);
    expect(result.data).toEqual([]);
    expect(result.meta.currentPage).toBe(1);
    expect(result.meta.lastPage).toBe(1);
  });
});

/* ------------------------------------------------------------------ */
/*  mapBanner                                                          */
/* ------------------------------------------------------------------ */
describe("mapBanner", () => {
  it("maps a banner correctly", () => {
    const b = mapBanner({ id: 1, title: "Sale", subtitle: "50% Off", image: "banner.jpg", mobile_image: "m-banner.jpg", buttons: [{ label: "Shop", href: "/sale" }] });
    expect(b.title).toBe("Sale");
    expect(b.subtitle).toBe("50% Off");
    expect(b.mobileImage).toBe("m-banner.jpg");
    expect(b.buttons).toHaveLength(1);
  });

  it("handles null subtitle and mobile_image", () => {
    const b = mapBanner({ id: 2, title: "T", image: "i.jpg" });
    expect(b.subtitle).toBeNull();
    expect(b.mobileImage).toBeNull();
    expect(b.buttons).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/*  mapCart                                                             */
/* ------------------------------------------------------------------ */
describe("mapCart", () => {
  it("maps a cart with items and totals", () => {
    const raw = {
      token: "abc-123",
      items: [{
        id: 1, variant_id: 10, product_id: 5, slug: "p-1", name: "Product 1",
        variant_name: "Size M", sku: "SKU-1", image: "img.jpg",
        unit_price: 1000, regular_price: 1200, quantity: 2, max_quantity: 10,
        line_total: 2000, in_stock: true,
      }],
      issues: [{ item_id: 1, message: "Low stock" }],
      coupon_code: "SAVE10",
      coupon_error: null,
      item_count: 2,
      subtotal: 2000,
      discount_total: 200,
      shipping_total: 150,
      tax_total: 0,
      grand_total: 1950,
    };
    const cart = mapCart(raw);
    expect(cart.token).toBe("abc-123");
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].variantId).toBe(10);
    expect(cart.items[0].variantName).toBe("Size M");
    expect(cart.items[0].unitPrice).toBe(1000);
    expect(cart.items[0].regularPrice).toBe(1200);
    expect(cart.issues).toHaveLength(1);
    expect(cart.couponCode).toBe("SAVE10");
    expect(cart.grandTotal).toBe(1950);
  });

  it("handles empty cart", () => {
    const cart = mapCart({});
    expect(cart.token).toBeNull();
    expect(cart.items).toEqual([]);
    expect(cart.itemCount).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/*  mapUser                                                            */
/* ------------------------------------------------------------------ */
describe("mapUser", () => {
  it("maps user fields", () => {
    const u = mapUser({ id: 1, name: "Ali", email: "ali@test.com", phone: "0300-1234567", role: "customer" });
    expect(u).toEqual({ id: 1, name: "Ali", email: "ali@test.com", phone: "0300-1234567", role: "customer" });
  });

  it("defaults phone to null", () => {
    const u = mapUser({ id: 2, name: "Sara", email: "sara@test.com", role: "admin" });
    expect(u.phone).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  mapAddress                                                         */
/* ------------------------------------------------------------------ */
describe("mapAddress", () => {
  it("maps address fields from snake_case", () => {
    const a = mapAddress({
      id: 1, label: "Home", full_name: "Ali Khan", phone: "0300-111",
      line1: "123 Main St", line2: "Apt 4", city: "Lahore",
      province: "Punjab", postal_code: "54000", country: "PK",
      is_default_shipping: true, is_default_billing: false,
    });
    expect(a.fullName).toBe("Ali Khan");
    expect(a.postalCode).toBe("54000");
    expect(a.isDefaultShipping).toBe(true);
    expect(a.isDefaultBilling).toBe(false);
  });

  it("defaults optional fields", () => {
    const a = mapAddress({ id: 2, full_name: "X", phone: "0", line1: "L", city: "C" });
    expect(a.label).toBeNull();
    expect(a.line2).toBeNull();
    expect(a.province).toBeNull();
    expect(a.postalCode).toBeNull();
    expect(a.country).toBe("PK");
  });
});

/* ------------------------------------------------------------------ */
/*  mapOrder                                                           */
/* ------------------------------------------------------------------ */
describe("mapOrder", () => {
  it("maps core order fields", () => {
    const raw = {
      number: "ORD-001", status: "confirmed", payment_status: "paid",
      payment_method_label: "COD", shipping_method: "standard",
      customer_name: "Ali", email: "a@b.com", phone: "0300",
      shipping_address: { full_name: "Ali", city: "Lahore" },
      subtotal: 5000, discount_total: 500, shipping_total: 200,
      tax_total: 0, grand_total: 4700, coupon_code: "SAVE",
      items_count: 2, items: [{ id: 1, name: "P1", sku: "S1", unit_price: 2500, quantity: 2, line_total: 5000, product_id: 1 }],
      status_history: [{ from: null, to: "pending", note: null, at: "2024-01-01" }],
      shipment: null, can_cancel: true, placed_at: "2024-01-01",
    };
    const o = mapOrder(raw);
    expect(o.number).toBe("ORD-001");
    expect(o.status).toBe("confirmed");
    expect(o.paymentStatus).toBe("paid");
    expect(o.paymentMethodLabel).toBe("COD");
    expect(o.grandTotal).toBe(4700);
    expect(o.couponCode).toBe("SAVE");
    expect(o.items).toHaveLength(1);
    expect(o.canCancel).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  mapPage                                                            */
/* ------------------------------------------------------------------ */
describe("mapPage", () => {
  it("maps content page", () => {
    const p = mapPage({ slug: "about", title: "About Us", sections: [{ heading: "H", body: "B" }], meta_title: "About", meta_description: "Desc", updated_at: "2024-01-01" });
    expect(p.slug).toBe("about");
    expect(p.title).toBe("About Us");
    expect(p.sections).toHaveLength(1);
    expect(p.metaTitle).toBe("About");
  });

  it("defaults optional fields", () => {
    const p = mapPage({ slug: "s", title: "T" });
    expect(p.sections).toEqual([]);
    expect(p.metaTitle).toBeNull();
    expect(p.metaDescription).toBeNull();
    expect(p.updatedAt).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  mapSettings                                                        */
/* ------------------------------------------------------------------ */
describe("mapSettings", () => {
  it("maps store settings correctly", () => {
    const raw = {
      store: { name: "Inaya", logo_type: "text", tagline: "Tagline", about: "About", email: "e@e.com", phone: "0300" },
      localization: { currency_symbol: "Rs." },
      announcements: ["Free shipping!"],
      shipping: { free_shipping_threshold: 500000, methods: [{ code: "standard", name: "Standard", fee: 20000 }] },
      payments: { methods: [{ code: "cod", name: "COD" }] },
      checkout: { allow_guest_checkout: true, max_quantity_per_item: 5 },
      navigation: [{ label: "Home", href: "/" }],
      trust: [],
      footer: { columns: [], copyright: "© 2024" },
      social: [],
      seo: { default_title: "Inaya", default_description: "Desc" },
    };
    const s = mapSettings(raw);
    expect(s.name).toBe("Inaya");
    expect(s.logoType).toBe("text");
    expect(s.freeShippingThreshold).toBe(5000); // divided by 100
    expect(s.shippingMethods[0].fee).toBe(200); // divided by 100
    expect(s.maxQuantityPerItem).toBe(5);
    expect(s.announcements).toEqual(["Free shipping!"]);
  });

  it("defaults to Store when store name missing", () => {
    const s = mapSettings({});
    expect(s.name).toBe("Store");
  });
});

/* ------------------------------------------------------------------ */
/*  mapHome                                                            */
/* ------------------------------------------------------------------ */
describe("mapHome", () => {
  it("maps home data with banners and sections", () => {
    const raw = {
      banners: [{ id: 1, title: "B", image: "b.jpg" }],
      promos: [],
      collection_strip: [],
      sections: [
        { id: 1, type: "reviews", title: "Reviews" },
        { id: 2, type: "latest", title: "Latest", products: [{ id: 1, slug: "p", sku: "S", name: "N", price: 100 }] },
      ],
    };
    const home = mapHome(raw);
    expect(home.banners).toHaveLength(1);
    expect(home.sections).toHaveLength(2);
    expect(home.sections[0].type).toBe("reviews");
    expect(home.sections[1].type).toBe("latest");
  });

  it("handles empty input gracefully", () => {
    const home = mapHome({});
    expect(home.banners).toEqual([]);
    expect(home.promos).toEqual([]);
    expect(home.sections).toEqual([]);
  });

  it("maps shop_the_look section", () => {
    const raw = {
      sections: [{
        id: 1, type: "shop_the_look", title: "Shop The Look",
        looks: [{ image: "look.jpg", products: [{ id: 1, slug: "p", sku: "S", name: "N", price: 100 }] }],
      }],
    };
    const home = mapHome(raw);
    const section = home.sections[0];
    expect(section.type).toBe("shop_the_look");
    if (section.type === "shop_the_look") {
      expect(section.looks).toHaveLength(1);
      expect(section.looks[0].products).toHaveLength(1);
    }
  });

  it("maps category_tabs section", () => {
    const raw = {
      sections: [{
        id: 1, type: "category_tabs", title: "Tabs",
        tabs: [{ category: { id: 1, slug: "c", name: "C", products_count: 5 }, total: 10, products: [] }],
      }],
    };
    const home = mapHome(raw);
    const section = home.sections[0];
    if (section.type === "category_tabs") {
      expect(section.tabs).toHaveLength(1);
      expect(section.tabs[0].category.slug).toBe("c");
      expect(section.tabs[0].total).toBe(10);
    }
  });

  it("maps banner_image section", () => {
    const raw = {
      sections: [{
        id: 1, type: "banner_image", title: "Banner", subtitle: "Sub",
        button_text: "Click", button_link: "/link", image: "img.jpg",
        slides: [{ image: "s.jpg", text: "T", link: "/l" }],
      }],
    };
    const home = mapHome(raw);
    const section = home.sections[0];
    if (section.type === "banner_image") {
      expect(section.subtitle).toBe("Sub");
      expect(section.button_text).toBe("Click");
      expect(section.slides).toHaveLength(1);
    }
  });
});
