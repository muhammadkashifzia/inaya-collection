"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, FormAlert, PasswordField, TextField } from "@/components/atoms";
import { useStore } from "@/context/StoreProvider";
import { useToast } from "@/context/ToastContext";
import { ApiError } from "@/lib/api";
import { AuthCard, safeNext } from "../AuthCard";

export function RegisterForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const { signUp } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", passwordConfirmation: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signUp({ ...form, email: form.email.trim() });
      toast.success("Account Created", "Welcome to Anaya Collection!");
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError("Could not create your account.", 0));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Create account" footer={<>Already have an account? <Link href="/account/login" className="font-semibold underline">Sign in</Link></>}>
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormAlert tone="error">{error && Object.keys(error.errors).length === 0 ? error.message : null}</FormAlert>
        <TextField label="Full name" autoComplete="name" required value={form.name} onChange={set("name")} error={error?.field("name")} maxLength={120} />
        <TextField label="Email" type="email" autoComplete="email" required value={form.email} onChange={set("email")} error={error?.field("email")} maxLength={255} />
        <TextField label="Phone (optional)" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} error={error?.field("phone")} maxLength={30} />
        <PasswordField label="Password" autoComplete="new-password" required value={form.password} onChange={set("password")} error={error?.field("password")} hint="At least 8 characters with letters and numbers." />
        <PasswordField label="Confirm password" autoComplete="new-password" required value={form.passwordConfirmation} onChange={set("passwordConfirmation")} />
        <Button type="submit" fullWidth size="lg" disabled={busy} aria-busy={busy}>
          {busy ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
