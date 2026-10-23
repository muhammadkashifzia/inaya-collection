"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, FormAlert, SelectField, TextField } from "@/components/atoms";
import { api, ApiError } from "@/lib/api";
import { PK_PROVINCES, citiesOf, areasOf } from "@/lib/pk-geo";
import type { Address, AddressInput } from "@/types";
import { AccountShell } from "../AccountShell";

type AddressForm = AddressInput & { area: string };
const blank: AddressForm = { label: "", fullName: "", phone: "", line1: "", line2: "", city: "", area: "", province: "", postalCode: "", country: "PK" };

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<{ id: number | null; form: AddressForm } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.addresses().then(setAddresses).catch(() => setLoadError("Could not load your addresses."));
  }, []);
  useEffect(load, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      const { area, ...rest } = editing.form;
      const input: AddressInput = { ...rest, line2: [area, rest.line2].filter(Boolean).join(", ") || null, province: rest.province || null, postalCode: rest.postalCode || null };
      if (editing.id) await api.updateAddress(editing.id, input);
      else await api.createAddress(input);
      setEditing(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError("Could not save the address.", 0));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this address?")) return;
    await api.deleteAddress(id).catch(() => undefined);
    load();
  }

  const f = editing?.form;
  const set = (key: keyof AddressForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setEditing((cur) => (cur ? { ...cur, form: { ...cur.form, [key]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value } } : cur));
  const setForm = (patch: Partial<AddressForm>) => setEditing((cur) => (cur ? { ...cur, form: { ...cur.form, ...patch } } : cur));
  const err = (k: string) => error?.field(k);

  return (
    <AccountShell title="Addresses">
      <FormAlert tone="error">{loadError}</FormAlert>
      {editing && f ? (
        <form onSubmit={save} className="grid max-w-2xl gap-4 md:grid-cols-2" noValidate>
          <h2 className="font-heading text-xl font-semibold md:col-span-2">{editing.id ? "Edit address" : "New address"}</h2>
          <TextField label="Label (e.g. Home)" value={f.label ?? ""} onChange={set("label")} maxLength={40} />
          <TextField label="Full name" required value={f.fullName} onChange={set("fullName")} error={err("full_name")} maxLength={120} />
          <TextField label="Phone" type="tel" required value={f.phone} onChange={set("phone")} error={err("phone")} maxLength={30} />
          <SelectField label="Province" required value={f.province ?? ""} onChange={(e) => setForm({ province: e.target.value, city: "", area: "" })} error={err("province")}>
            <option value="">Select province</option>
            {PK_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </SelectField>
          <SelectField label="City" required value={f.city} onChange={(e) => setForm({ city: e.target.value, area: "" })} error={err("city")} disabled={!f.province}>
            <option value="">Select city</option>
            {citiesOf(f.province ?? "").map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectField>
          <SelectField className="md:col-span-2" label="Area" value={f.area} onChange={set("area")} error={err("area")} disabled={!f.city}>
            <option value="">Select area</option>
            {areasOf(f.province ?? "", f.city).map((a) => <option key={a} value={a}>{a}</option>)}
          </SelectField>
          <TextField className="md:col-span-2" label="Street address" required value={f.line1} onChange={set("line1")} error={err("line1")} maxLength={255} placeholder="House #, Street, Road" />
          <TextField className="md:col-span-2" label="Apartment, suite (optional)" value={f.line2 ?? ""} onChange={set("line2")} maxLength={255} />
          <TextField label="Postal code" value={f.postalCode ?? ""} onChange={set("postalCode")} maxLength={20} />
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={Boolean(f.isDefaultShipping)} onChange={set("isDefaultShipping")} /> Default delivery address
          </label>
          <div className="flex gap-3 md:col-span-2">
            <Button type="submit" disabled={busy} aria-busy={busy}>{busy ? "Saving…" : "Save address"}</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {addresses === null && !loadError && <p className="text-muted">Loading addresses…</p>}
          {addresses?.length === 0 && <p className="text-muted">You haven&apos;t saved any addresses yet.</p>}
          <ul className="grid gap-4 md:grid-cols-2">
            {addresses?.map((a) => (
              <li key={a.id} className="border border-line p-4 text-sm">
                <p className="mb-1 font-semibold">
                  {a.label ?? a.fullName}
                  {a.isDefaultShipping && <span className="ml-2 bg-cream px-2 py-0.5 text-[10px] uppercase tracking-wider">Default</span>}
                </p>
                <address className="not-italic text-ink/80">
                  {a.fullName}<br />{a.line1}{a.line2 && `, ${a.line2}`}<br />{a.city}{a.province && `, ${a.province}`}<br />{a.phone}
                </address>
                <div className="mt-3 flex gap-4 text-xs font-semibold uppercase">
                  <button type="button" className="underline" onClick={() => setEditing({ id: a.id, form: { ...a, area: "" } })}>Edit</button>
                  <button type="button" className="text-brand underline" onClick={() => remove(a.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
          <Button onClick={() => { setError(null); setEditing({ id: null, form: blank }); }}>Add address</Button>
        </div>
      )}
    </AccountShell>
  );
}
