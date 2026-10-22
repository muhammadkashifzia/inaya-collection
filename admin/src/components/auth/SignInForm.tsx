import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Notice, TextInput } from "@/components/admin/Fields";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { EyeCloseIcon, EyeIcon } from "@/icons";
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
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-start md:justify-center">
        {/* Mobile logo – visible below lg only */}
        <div className="mb-8 flex items-center justify-center lg:hidden">
          <img src="/images/logo/anaya-collection-logo.svg" alt="Anaya Collection" className="h-16 w-auto dark:brightness-0 dark:invert" />
        </div>

        <div className="mb-8">
          <h1 className="mb-2 font-display text-title-sm font-semibold text-ink-900 dark:text-white/90">Sign in</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Use your Anaya Collection staff account.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <Notice tone="error">{error && !error.field("email") ? error.message : null}</Notice>
          <TextInput label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={error?.field("email")} maxLength={255} />
          <div className="relative">
            <TextInput label="Password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} error={error?.field("password")} maxLength={255} />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3.5 top-[34px] flex size-7 items-center justify-center rounded text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeIcon className="size-5 text-black" /> : <EyeCloseIcon className="size-5" />}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-brand-500" />
              Keep me signed in
            </label>
            <a href="/forgot-password" className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400">
              Forgot password?
            </a>
          </div>
          <Button type="submit" className="w-full" loading={busy}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
