import { useState } from "react";
import Card from "@/components/admin/Card";
import DataState from "@/components/admin/DataState";
import { Notice, TextAreaInput, TextInput, Toggle } from "@/components/admin/Fields";
import PageHeader from "@/components/admin/PageHeader";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import { useApi } from "@/hooks/useApi";
import { ApiError, http } from "@/lib/api";
import type { StoreSettings } from "@/types/api";
import LinkListEditor from "./LinkListEditor";

/** Money settings are stored in paisa; the form edits rupees. */
const toRs = (minor: number | null | undefined) => (minor == null ? "" : String(minor / 100));
const toMinor = (rs: string) => (rs === "" ? null : Math.round(Number(rs) * 100));

const TABS = ["Store", "Shipping & tax", "Checkout & payments", "Navigation & footer", "SEO & social"] as const;
type Tab = (typeof TABS)[number];

export default function Settings() {
  const { data, error, loading, reload } = useApi(() => http.get<{ data: StoreSettings }>("/admin/settings").then((r) => r.data), []);
  const [draft, setDraft] = useState<StoreSettings | null>(null);
  const [tab, setTab] = useState<Tab>("Store");
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<ApiError | null>(null);
  const [saved, setSaved] = useState(false);

  const s = draft ?? data;
  const update = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => s && setDraft({ ...s, [key]: value });

  async function save() {
    if (!draft) return;
    setBusy(true);
    setSaveError(null);
    setSaved(false);
    try {
      await http.put("/admin/settings", draft);
      setDraft(null);
      setSaved(true);
      reload();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err : new ApiError("Could not save settings.", 0));
    } finally {
      setBusy(false);
    }
  }

  const fe = (k: string) => saveError?.field(k);

  return (
    <>
      <PageMeta title="Settings | Inaya Collection Admin" description="Store configuration." />
      <PageHeader
        title="Settings"
        description="Store details, shipping, payments and storefront content. Changes reach the website within about a minute."
        actions={
          <>
            {draft && <Button variant="outline" onClick={() => setDraft(null)}>Discard changes</Button>}
            <Button onClick={() => void save()} loading={busy} disabled={!draft}>Save settings</Button>
          </>
        }
      />
      <div className="mb-4 space-y-3">
        <Notice tone="success">{saved ? "Settings saved." : null}</Notice>
        <Notice tone="error">{saveError && (Object.keys(saveError.errors).length ? `Please check: ${saveError.firstMessage}` : saveError.message)}</Notice>
      </div>
      <DataState loading={loading} error={error} onRetry={reload} hasData={Boolean(s)}>
        {s && (
          <div className="grid grid-cols-12 gap-6">
            <nav aria-label="Settings sections" className="col-span-12 lg:col-span-3">
              <ul className="flex gap-1 overflow-x-auto lg:flex-col">
                {TABS.map((t) => (
                  <li key={t}>
                    <button
                      type="button"
                      aria-current={tab === t ? "page" : undefined}
                      onClick={() => setTab(t)}
                      className={`w-full rounded-lg px-4 py-2.5 text-start text-sm font-medium whitespace-nowrap ${tab === t ? "bg-ink-900 text-white dark:bg-white/10" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"}`}
                    >
                      {t}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="col-span-12 space-y-6 lg:col-span-9">
              {tab === "Store" && (
                <>
                  <Card title="Store details">
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="Store name" required value={s.store.name} onChange={(e) => update("store", { ...s.store, name: e.target.value })} error={fe("store.name")} maxLength={120} />
                      <TextInput label="Tagline" value={s.store.tagline ?? ""} onChange={(e) => update("store", { ...s.store, tagline: e.target.value })} maxLength={255} />
                      <TextAreaInput className="md:col-span-2" label="About (footer)" rows={2} value={s.store.about ?? ""} onChange={(e) => update("store", { ...s.store, about: e.target.value })} maxLength={1000} />
                      <TextInput label="Support email" type="email" value={s.store.email ?? ""} onChange={(e) => update("store", { ...s.store, email: e.target.value })} error={fe("store.email")} />
                      <TextInput label="Phone" value={s.store.phone ?? ""} onChange={(e) => update("store", { ...s.store, phone: e.target.value })} maxLength={30} />
                      <TextInput label="WhatsApp" value={s.store.whatsapp ?? ""} onChange={(e) => update("store", { ...s.store, whatsapp: e.target.value })} maxLength={30} />
                      <TextInput label="Opening hours" value={s.store.hours ?? ""} onChange={(e) => update("store", { ...s.store, hours: e.target.value })} maxLength={120} />
                      <TextAreaInput className="md:col-span-2" label="Address" rows={2} value={s.store.address ?? ""} onChange={(e) => update("store", { ...s.store, address: e.target.value })} maxLength={500} />
                    </div>
                  </Card>
                  <Card title="Localization">
                    <div className="grid gap-4 md:grid-cols-3">
                      <TextInput label="Currency code" value={s.localization.currency} onChange={(e) => update("localization", { ...s.localization, currency: e.target.value.toUpperCase().slice(0, 3) })} error={fe("localization.currency")} />
                      <TextInput label="Currency symbol" value={s.localization.currency_symbol} onChange={(e) => update("localization", { ...s.localization, currency_symbol: e.target.value })} maxLength={5} />
                      <TextInput label="Timezone" value={s.localization.timezone} onChange={(e) => update("localization", { ...s.localization, timezone: e.target.value })} error={fe("localization.timezone")} hint="e.g. Asia/Karachi" />
                    </div>
                  </Card>
                  <Card title="Announcement bar" description="Messages rotate at the top of every page.">
                    <div className="space-y-2">
                      {s.announcements.map((a, i) => (
                        <div key={i} className="flex gap-2">
                          <input aria-label={`Announcement ${i + 1}`} className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" value={a} maxLength={160} onChange={(e) => update("announcements", s.announcements.map((x, xi) => (xi === i ? e.target.value : x)))} />
                          <button type="button" aria-label="Remove" className="px-2 text-gray-400 hover:text-error-500" onClick={() => update("announcements", s.announcements.filter((_, xi) => xi !== i))}>×</button>
                        </div>
                      ))}
                      {s.announcements.length < 10 && <button type="button" className="text-sm font-medium text-brand-500" onClick={() => update("announcements", [...s.announcements, ""])}>+ Add message</button>}
                    </div>
                  </Card>
                  <Card title="Trust badges" description="The four icons under the hero banner.">
                    <div className="space-y-3">
                      {s.trust.map((t, i) => (
                        <div key={i} className="grid gap-2 md:grid-cols-[120px_1fr_1fr_auto]">
                          <select aria-label="Icon" className="h-10 rounded-lg border border-gray-300 px-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" value={t.icon} onChange={(e) => update("trust", s.trust.map((x, xi) => (xi === i ? { ...x, icon: e.target.value as typeof t.icon } : x)))}>
                            {["truck", "shield", "map", "lock"].map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                          </select>
                          <input aria-label="Title" className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" value={t.title} maxLength={60} onChange={(e) => update("trust", s.trust.map((x, xi) => (xi === i ? { ...x, title: e.target.value } : x)))} />
                          <input aria-label="Text" className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" value={t.text} maxLength={120} onChange={(e) => update("trust", s.trust.map((x, xi) => (xi === i ? { ...x, text: e.target.value } : x)))} />
                          <button type="button" aria-label="Remove" className="px-2 text-gray-400 hover:text-error-500" onClick={() => update("trust", s.trust.filter((_, xi) => xi !== i))}>×</button>
                        </div>
                      ))}
                      {s.trust.length < 6 && <button type="button" className="text-sm font-medium text-brand-500" onClick={() => update("trust", [...s.trust, { icon: "truck", title: "", text: "" }])}>+ Add badge</button>}
                    </div>
                  </Card>
                </>
              )}

              {tab === "Shipping & tax" && (
                <>
                  <Card title="Shipping methods" description="Fees in rupees. Free shipping applies to the “standard” method.">
                    <div className="space-y-3">
                      {s.shipping.methods.map((m, i) => (
                        <div key={i} className="grid items-center gap-2 md:grid-cols-[140px_1fr_120px_auto_auto]">
                          <input aria-label="Code" className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" value={m.code} onChange={(e) => update("shipping", { ...s.shipping, methods: s.shipping.methods.map((x, xi) => (xi === i ? { ...x, code: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") } : x)) })} placeholder="code" />
                          <input aria-label="Name" className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" value={m.name} maxLength={120} onChange={(e) => update("shipping", { ...s.shipping, methods: s.shipping.methods.map((x, xi) => (xi === i ? { ...x, name: e.target.value } : x)) })} />
                          <input aria-label="Fee (Rs.)" type="number" min={0} className="h-10 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" value={toRs(m.fee)} onChange={(e) => update("shipping", { ...s.shipping, methods: s.shipping.methods.map((x, xi) => (xi === i ? { ...x, fee: toMinor(e.target.value) ?? 0 } : x)) })} />
                          <Toggle label="Active" checked={m.is_active} onChange={(v) => update("shipping", { ...s.shipping, methods: s.shipping.methods.map((x, xi) => (xi === i ? { ...x, is_active: v } : x)) })} />
                          <button type="button" aria-label="Remove" disabled={s.shipping.methods.length <= 1} className="px-2 text-gray-400 hover:text-error-500 disabled:opacity-30" onClick={() => update("shipping", { ...s.shipping, methods: s.shipping.methods.filter((_, xi) => xi !== i) })}>×</button>
                        </div>
                      ))}
                      {fe("shipping.methods") && <p className="text-theme-xs text-error-600">{fe("shipping.methods")}</p>}
                      <button type="button" className="text-sm font-medium text-brand-500" onClick={() => update("shipping", { ...s.shipping, methods: [...s.shipping.methods, { code: "", name: "", fee: 0, is_active: true }] })}>+ Add method</button>
                    </div>
                    <div className="mt-6 max-w-xs">
                      <TextInput label="Free shipping above (Rs.)" type="number" min={0} value={toRs(s.shipping.free_shipping_threshold)} onChange={(e) => update("shipping", { ...s.shipping, free_shipping_threshold: toMinor(e.target.value) })} hint="Empty = never free" />
                    </div>
                  </Card>
                  <Card title="Tax">
                    <div className="grid items-start gap-4 md:grid-cols-2">
                      <TextInput label="Tax rate (%)" type="number" min={0} max={100} step={0.01} value={String(s.tax.rate_percent)} onChange={(e) => update("tax", { ...s.tax, rate_percent: Number(e.target.value) })} error={fe("tax.rate_percent")} />
                      <Toggle label="Prices include tax" description="When on, no extra tax is added at checkout." checked={s.tax.prices_include_tax} onChange={(v) => update("tax", { ...s.tax, prices_include_tax: v })} />
                    </div>
                  </Card>
                  <Card title="Inventory">
                    <div className="max-w-xs">
                      <TextInput label="Default low-stock alert" type="number" min={0} value={String(s.inventory.default_low_stock_threshold)} onChange={(e) => update("inventory", { default_low_stock_threshold: Number(e.target.value) })} />
                    </div>
                  </Card>
                </>
              )}

              {tab === "Checkout & payments" && (
                <>
                  <Card title="Payments" description="Online gateways are not connected yet. Credentials are never stored here.">
                    <div className="space-y-5">
                      <Toggle label="Cash on Delivery" description="Payment is marked paid when the order is delivered." checked={s.payments.cod_enabled} onChange={(v) => update("payments", { ...s.payments, cod_enabled: v })} />
                      <div className="max-w-xs">
                        <TextInput label="COD limit (Rs.)" type="number" min={0} value={toRs(s.payments.cod_max_order_amount)} onChange={(e) => update("payments", { ...s.payments, cod_max_order_amount: toMinor(e.target.value) })} hint="Orders above this can't use COD. Empty = no limit." />
                      </div>
                    </div>
                  </Card>
                  <Card title="Checkout">
                    <div className="space-y-5">
                      <Toggle label="Allow guest checkout" checked={s.checkout.allow_guest_checkout} onChange={(v) => update("checkout", { ...s.checkout, allow_guest_checkout: v })} />
                      <div className="max-w-xs">
                        <TextInput label="Max quantity per item" type="number" min={1} max={100} value={String(s.checkout.max_quantity_per_item)} onChange={(e) => update("checkout", { ...s.checkout, max_quantity_per_item: Number(e.target.value) })} error={fe("checkout.max_quantity_per_item")} />
                      </div>
                    </div>
                  </Card>
                </>
              )}

              {tab === "Navigation & footer" && (
                <>
                  <Card title="Main menu">
                    <LinkListEditor links={s.navigation} onChange={(navigation) => update("navigation", navigation)} max={20} />
                  </Card>
                  <Card title="Footer columns">
                    <div className="space-y-6">
                      {s.footer.columns.map((col, ci) => (
                        <fieldset key={ci} className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                          <div className="flex gap-2">
                            <input aria-label="Column heading" className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm font-semibold dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" value={col.heading} maxLength={60} onChange={(e) => update("footer", { ...s.footer, columns: s.footer.columns.map((c, i) => (i === ci ? { ...c, heading: e.target.value } : c)) })} />
                            <button type="button" className="text-theme-xs text-error-600" onClick={() => update("footer", { ...s.footer, columns: s.footer.columns.filter((_, i) => i !== ci) })}>Remove column</button>
                          </div>
                          <LinkListEditor links={col.links} onChange={(links) => update("footer", { ...s.footer, columns: s.footer.columns.map((c, i) => (i === ci ? { ...c, links } : c)) })} max={10} />
                        </fieldset>
                      ))}
                      {s.footer.columns.length < 5 && <button type="button" className="text-sm font-medium text-brand-500" onClick={() => update("footer", { ...s.footer, columns: [...s.footer.columns, { heading: "New column", links: [] }] })}>+ Add column</button>}
                      <TextInput label="Copyright line" value={s.footer.copyright ?? ""} onChange={(e) => update("footer", { ...s.footer, copyright: e.target.value })} maxLength={160} />
                    </div>
                  </Card>
                </>
              )}

              {tab === "SEO & social" && (
                <>
                  <Card title="Search engines">
                    <div className="grid gap-4">
                      <TextInput label="Default page title" value={s.seo.default_title ?? ""} onChange={(e) => update("seo", { ...s.seo, default_title: e.target.value })} maxLength={255} />
                      <TextAreaInput label="Default description" rows={2} value={s.seo.default_description ?? ""} onChange={(e) => update("seo", { ...s.seo, default_description: e.target.value })} maxLength={500} />
                    </div>
                  </Card>
                  <Card title="Social links" description="Must be https:// links.">
                    <LinkListEditor links={s.social} onChange={(social) => update("social", social)} max={10} placeholderHref="https://instagram.com/…" />
                    {fe("social") && <p className="mt-2 text-theme-xs text-error-600">{fe("social")}</p>}
                  </Card>
                </>
              )}
            </div>
          </div>
        )}
      </DataState>
    </>
  );
}
