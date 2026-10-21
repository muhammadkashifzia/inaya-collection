"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, FormAlert, TextField } from "@/components/atoms";
import { useStore } from "@/context/StoreProvider";
import { useToast } from "@/context/ToastContext";
import { ApiError } from "@/lib/api";
import { AuthCard, safeNext } from "../AuthCard";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { signIn, user, authReady } = useStore();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (authReady && user) router.replace(next);
  }, [authReady, user, next, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password, remember);
      toast.success("Welcome Back!", "You have been signed in.");
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError("Could not sign in. Please try again.", 0));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      footer={
        <>
          New to the store? <Link href={`/account/register${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold underline">Create an account</Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormAlert tone="error">{error && !error.field("email") ? error.message : null}</FormAlert>
        <TextField label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={error?.field("email")} maxLength={255} />
        <TextField label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} error={error?.field("password")} maxLength={255} />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
          </label>
          <Link href="/account/forgot-password" className="underline">Forgot password?</Link>
        </div>
        <Button type="submit" fullWidth size="lg" disabled={busy} aria-busy={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}
