import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Card from "@/components/admin/Card";
import DataState from "@/components/admin/DataState";
import { Notice, SelectInput, TextAreaInput, TextInput, Toggle } from "@/components/admin/Fields";
import PageHeader from "@/components/admin/PageHeader";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import { useApi } from "@/hooks/useApi";
import { ApiError, http, STOREFRONT_URL } from "@/lib/api";
import { slugify, toLocalInput } from "@/lib/format";
import type { Category, Product, ProductStatus } from "@/types/api";
import ProductImages from "./ProductImages";
import VariantEditor, { type VariantDraft } from "./VariantEditor";

interface FormState {
  category_id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  short_description: string;
  description: string;
  details: string;
  fabric: string;
  pieces: string;
  price: string;
  sale_price: string;
  status: ProductStatus;
  is_featured: boolean;
  low_stock_threshold: string;
  meta_title: string;
  meta_description: string;
  published_at: string;
}

const empty: FormState = {
  category_id: "",
  name: "",
  slug: "",
  sku: "",
  brand: "Anaya Collection",
  short_description: "",
  description: "",
  details: "",
  fabric: "",
  pieces: "",
  price: "",
  sale_price: "",
  status: "draft",
  is_featured: false,
  low_stock_threshold: "5",
  meta_title: "",
  meta_description: "",
  published_at: "",
};

function fromProduct(p: Product): FormState {
  return {
    category_id: p.category ? String(p.category.id) : "",
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    brand: p.brand ?? "",
    short_description: p.short_description ?? "",
    description: p.description ?? "",
    details: (p.details ?? []).join("\n"),
    fabric: p.fabric ?? "",
    pieces: p.pieces ? String(p.pieces) : "",
    price: String(p.price),
    sale_price: p.sale_price_raw != null ? String(p.sale_price_raw) : "",
    status: p.status,
    is_featured: p.is_featured,
    low_stock_threshold: String(p.low_stock_threshold),
    meta_title: p.meta_title ?? "",
    meta_description: p.meta_description ?? "",
    published_at: toLocalInput(p.published_at),
  };
}

/** Create / edit a product with variants, images and SEO fields. */
export default function ProductForm() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const categories = useApi(() => http.get<Category[]>("/admin/categories"), []);
  const product = useApi(() => (isNew ? Promise.resolve(null) : http.get<Product>(`/admin/products/${id}`)), [id]);

  const [form, setForm] = useState<FormState>(empty);
  const [variants, setVariants] = useState<VariantDraft[]>([{ sku: "", name: "Default", options: [], price: "", sale_price: "", stock: "0", is_active: true }]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [saved, setSaved] = useState(false);

  // Populate the form once the product loads.
  const [loadedId, setLoadedId] = useState<number | null>(null);
  if (product.data && product.data.id !== loadedId) {
    setLoadedId(product.data.id);
    setForm(fromProduct(product.data));
    setSlugTouched(true);
    setVariants(
      (product.data.variants ?? []).map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        options: Object.entries(v.options ?? {}).map(([key, value]) => ({ key, value })),
        price: v.price_override != null ? String(v.price_override) : "",
        sale_price: v.sale_price_override != null ? String(v.sale_price_override) : "",
        stock: String(v.stock ?? 0),
        is_active: v.is_active,
      })),
    );
  }

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(false), 3000);
    return () => window.clearTimeout(t);
  }, [saved]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const fieldError = (name: string) => error?.field(name);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      category_id: Number(form.category_id) || null,
      name: form.name,
      slug: form.slug || null,
      sku: form.sku,
      brand: form.brand || null,
      short_description: form.short_description || null,
      description: form.description || null,
      details: form.details.split("\n").map((d) => d.trim()).filter(Boolean),
      fabric: form.fabric || null,
      pieces: form.pieces ? Number(form.pieces) : null,
      price: form.price === "" ? null : Number(form.price),
      sale_price: form.sale_price === "" ? null : Number(form.sale_price),
      status: form.status,
      is_featured: form.is_featured,
      low_stock_threshold: Number(form.low_stock_threshold || 0),
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      variants: variants.map((v) => ({
        id: v.id ?? null,
        sku: v.sku,
        name: v.name,
        options: Object.fromEntries(v.options.filter((o) => o.key && o.value).map((o) => [o.key, o.value])),
        price: v.price === "" ? null : Number(v.price),
        sale_price: v.sale_price === "" ? null : Number(v.sale_price),
        stock: v.id ? undefined : Number(v.stock || 0),
        is_active: v.is_active,
      })),
    };
    try {
      const result = isNew ? await http.post<Product>("/admin/products", payload) : await http.put<Product>(`/admin/products/${id}`, payload);
      setSaved(true);
      if (isNew) navigate(`/products/${result.id}`, { replace: true });
      else product.setData(result);
      setLoadedId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError("Could not save the product.", 0));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!window.confirm("Delete this product? It will be hidden from the store; order history is kept.")) return;
    await http.delete(`/admin/products/${id}`);
    navigate("/products", { replace: true });
  }

  const p = product.data;

  return (
    <>
      <PageMeta title={`${isNew ? "Add product" : (p?.name ?? "Product")} | Anaya Collection Admin`} description="Edit product details." />
      <PageHeader
        title={isNew ? "Add product" : (p?.name ?? "Edit product")}
        back={{ to: "/products", label: "Products" }}
        actions={
          !isNew &&
          p && (
            <>
              {p.status === "active" && (
                <a href={`${STOREFRONT_URL}/products/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-600 hover:text-brand-500 dark:text-gray-300">
                  View on store ↗
                </a>
              )}
              <Button variant="danger" size="sm" onClick={() => void onDelete()}>
                Delete
              </Button>
            </>
          )
        }
      />
      <DataState loading={product.loading || categories.loading} error={product.error ?? categories.error} onRetry={product.reload} hasData={isNew || Boolean(p)}>
        <form onSubmit={onSubmit} noValidate className="grid grid-cols-12 gap-6">
          <div className="col-span-12 space-y-6 xl:col-span-8">
            <Notice tone="error">{error && (Object.keys(error.errors).length ? "Please fix the highlighted fields." : error.message)}</Notice>
            <Notice tone="success">{saved ? "Product saved." : null}</Notice>

            <Card title="Details">
              <div className="grid gap-5 md:grid-cols-2">
                <TextInput
                  className="md:col-span-2"
                  label="Product name"
                  required
                  value={form.name}
                  maxLength={255}
                  error={fieldError("name")}
                  onChange={(e) => {
                    set("name", e.target.value);
                    if (!slugTouched) set("slug", slugify(e.target.value));
                  }}
                />
                <TextInput label="URL slug" value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} error={fieldError("slug")} hint={`/products/${form.slug || "…"}`} maxLength={255} />
                <TextInput label="SKU" required value={form.sku} onChange={(e) => set("sku", e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))} error={fieldError("sku")} maxLength={64} />
                <SelectInput
                  label="Category"
                  required
                  value={form.category_id}
                  onChange={(e) => set("category_id", e.target.value)}
                  placeholder="Choose a category"
                  options={(categories.data ?? []).map((c) => ({ value: String(c.id), label: c.parent ? `${c.parent.name} › ${c.name}` : c.name }))}
                  error={fieldError("category_id")}
                />
                <TextInput label="Brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} maxLength={100} />
                <TextInput label="Fabric" value={form.fabric} onChange={(e) => set("fabric", e.target.value)} placeholder="Khaddar, Karandi…" maxLength={60} />
                <TextInput label="Pieces" type="number" min={1} max={10} value={form.pieces} onChange={(e) => set("pieces", e.target.value)} error={fieldError("pieces")} />
                <TextAreaInput className="md:col-span-2" label="Short description" rows={2} value={form.short_description} onChange={(e) => set("short_description", e.target.value)} maxLength={1000} />
                <TextAreaInput className="md:col-span-2" label="Description" rows={6} value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={20000} />
                <TextAreaInput className="md:col-span-2" label="What's included (one per line)" rows={3} value={form.details} onChange={(e) => set("details", e.target.value)} placeholder={"Printed shirt – 3 m\nDupatta – 2.5 m"} />
              </div>
            </Card>

            <Card title="Pricing" description="Prices in rupees. Leave sale price empty when not on sale.">
              <div className="grid gap-5 md:grid-cols-3">
                <TextInput label="Price (Rs.)" type="number" min={0} step={1} required value={form.price} onChange={(e) => set("price", e.target.value)} error={fieldError("price")} />
                <TextInput label="Sale price (Rs.)" type="number" min={0} step={1} value={form.sale_price} onChange={(e) => set("sale_price", e.target.value)} error={fieldError("sale_price")} />
                <TextInput label="Low-stock alert at" type="number" min={0} value={form.low_stock_threshold} onChange={(e) => set("low_stock_threshold", e.target.value)} hint="Units per variant" />
              </div>
            </Card>

            <VariantEditor variants={variants} onChange={setVariants} error={error} />

            {!isNew && p && <ProductImages product={p} onChange={product.reload} />}

            <Card title="Search engine listing">
              <div className="grid gap-5">
                <TextInput label="Meta title" value={form.meta_title} onChange={(e) => set("meta_title", e.target.value)} maxLength={255} hint="Defaults to the product name" />
                <TextAreaInput label="Meta description" rows={2} value={form.meta_description} onChange={(e) => set("meta_description", e.target.value)} maxLength={500} />
              </div>
            </Card>
          </div>

          <div className="col-span-12 space-y-6 xl:col-span-4">
            <Card title="Visibility">
              <div className="space-y-5">
                <SelectInput
                  label="Status"
                  value={form.status}
                  onChange={(e) => set("status", e.target.value as ProductStatus)}
                  options={[
                    { value: "active", label: "Active — visible on the store" },
                    { value: "draft", label: "Draft — hidden" },
                    { value: "archived", label: "Archived — hidden, discontinued" },
                  ]}
                  error={fieldError("status")}
                />
                <TextInput label="Publish date" type="datetime-local" value={form.published_at} onChange={(e) => set("published_at", e.target.value)} hint="Leave empty to publish immediately" />
                <Toggle label="Featured product" description="Shown in featured sections" checked={form.is_featured} onChange={(v) => set("is_featured", v)} />
              </div>
            </Card>
            <div className="sticky top-24 space-y-3">
              <Button type="submit" className="w-full" loading={busy}>
                {isNew ? "Create product" : "Save changes"}
              </Button>
              {isNew && <p className="text-center text-theme-xs text-gray-500">You can add images after creating the product.</p>}
            </div>
          </div>
        </form>
      </DataState>
    </>
  );
}
