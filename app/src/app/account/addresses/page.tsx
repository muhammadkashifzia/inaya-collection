"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, FormAlert, TextField } from "@/components/atoms";
import { api, ApiError } from "@/lib/api";
import type { Address, AddressInput } from "@/types";
import { AccountShell } from "../AccountShell";

const blank: AddressInput = { label: "", fullName: "", phone: "", line1: "", line2: "", city: "", province: "", postalCode: "", country: "PK" };

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<{ id: number | null; form: AddressInput } | null>(null);
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
      if (editing.id) await api.updateAddress(editing.id, editing.form);
      else await api.createAddress(editing.form);
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
  const set = (key: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEditing((cur) => (cur ? { ...cur, form: { ...cur.form, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value } } : cur));
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
          <TextField label="City" required value={f.city} onChange={set("city")} error={err("city")} maxLength={100} />
          <TextField className="md:col-span-2" label="Address" required value={f.line1} onChange={set("line1")} error={err("line1")} maxLength={255} />
          <TextField className="md:col-span-2" label="Apartment, area (optional)" value={f.line2 ?? ""} onChange={set("line2")} maxLength={255} />
          <TextField label="Province" value={f.province ?? ""} onChange={set("province")} maxLength={100} />
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
                  <button type="button" className="underline" onClick={() => setEditing({ id: a.id, form: { ...a } })}>Edit</button>
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
