import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Notice, TextInput } from "@/components/admin/Fields";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

/** Staff sign-in against POST /api/v1/auth/login (Sanctum session). */
export default function SignInForm() {
  const { login, user, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  if (ready && user) return <Navigate to={from} replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password, remember);
      navigate(from.startsWith("/") && !from.startsWith("//") ? from : "/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError("Sign-in failed. Please try again.", 0));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col lg:w-1/2">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-8">
          <h1 className="mb-2 font-display text-title-sm font-semibold text-ink-900 dark:text-white/90">Sign in</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Use your Galaxy Wear staff account.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <Notice tone="error">{error && !error.field("email") ? error.message : null}</Notice>
          <TextInput label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={error?.field("email")} maxLength={255} />
          <TextInput label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} error={error?.field("password")} maxLength={255} />
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-brand-500" />
            Keep me signed in
          </label>
          <Button type="submit" className="w-full" loading={busy}>
            Sign in
          </Button>
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">Forgot your password? Ask an administrator to reset it, or use the storefront&apos;s password reset.</p>
        </form>
      </div>
    </div>
  );
}
