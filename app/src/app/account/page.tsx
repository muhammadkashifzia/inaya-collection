"use client";

import { useState } from "react";
import { Button, FormAlert, TextField } from "@/components/atoms";
import { useStore } from "@/context/StoreProvider";
import { useToast } from "@/context/ToastContext";
import { api, ApiError } from "@/lib/api";
import { AccountShell } from "./AccountShell";

export default function AccountPage() {
  return (
    <AccountShell title="My account">
      <div className="space-y-12">
        <ProfileForm />
        <PasswordForm />
      </div>
    </AccountShell>
  );
}

function ProfileForm() {
  const { user, setUser } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setUser(await api.updateProfile({ name: form.name, email: form.email.trim(), phone: form.phone || null }));
      toast.success("Your profile has been updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError("Could not save.", 0));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="mb-4 font-heading text-xl font-semibold">Profile</h2>
      <form onSubmit={onSubmit} className="grid max-w-xl gap-4" noValidate>
        <FormAlert tone="error">{error && Object.keys(error.errors).length === 0 ? error.message : null}</FormAlert>
        <TextField label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={error?.field("name")} maxLength={120} />
        <TextField label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={error?.field("email")} maxLength={255} />
        <TextField label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={error?.field("phone")} maxLength={30} />
        <div><Button type="submit" disabled={busy} aria-busy={busy}>{busy ? "Saving…" : "Save changes"}</Button></div>
      </form>
    </section>
  );
}

function PasswordForm() {
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: "", password: "", passwordConfirmation: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.updatePassword(form);
      toast.success("Password changed. Other devices were signed out.");
      setForm({ currentPassword: "", password: "", passwordConfirmation: "" });
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError("Could not change password.", 0));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="password-heading">
      <h2 id="password-heading" className="mb-4 font-heading text-xl font-semibold">Change password</h2>
      <form onSubmit={onSubmit} className="grid max-w-xl gap-4" noValidate>
        <FormAlert tone="error">{error && Object.keys(error.errors).length === 0 ? error.message : null}</FormAlert>
        <TextField label="Current password" type="password" autoComplete="current-password" required value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} error={error?.field("current_password")} />
        <TextField label="New password" type="password" autoComplete="new-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={error?.field("password")} hint="At least 8 characters with letters and numbers." />
        <TextField label="Confirm new password" type="password" autoComplete="new-password" required value={form.passwordConfirmation} onChange={(e) => setForm({ ...form, passwordConfirmation: e.target.value })} />
        <div><Button type="submit" disabled={busy} aria-busy={busy}>{busy ? "Saving…" : "Update password"}</Button></div>
      </form>
    </section>
  );
}
