import { useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Notice } from "@/components/admin/Fields";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

/** Six individual digit inputs for the TOTP code. */
export default function TwoFactorForm() {
  const { verifyTwoFactor, twoFactorState, user, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If 2FA is not pending, redirect away.
  if (ready && user) return <Navigate to={from} replace />;
  if (ready && twoFactorState !== "challenge") return <Navigate to="/signin" replace />;

  const code = digits.join("");

  function handleChange(index: number, value: string) {
    // Allow only digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    // Auto-advance to the next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] ?? "";
    }
    setDigits(next);
    // Focus the last filled input or the next empty one
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await verifyTwoFactor(code);
      navigate(from.startsWith("/") && !from.startsWith("//") ? from : "/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError("Verification failed. Please try again.", 0));
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col lg:w-1/2">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-8">
          <h1 className="mb-2 font-display text-title-sm font-semibold text-ink-900 dark:text-white/90">Two-factor authentication</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Enter the 6-digit code from your authenticator app.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-6" noValidate>
          <Notice tone="error">{error ? (error.field("code") ?? error.message) : null}</Notice>

          <div className="flex justify-center gap-3" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={1}
                aria-label={`Digit ${i + 1}`}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-14 w-12 rounded-xl border border-gray-300 bg-transparent text-center text-xl font-semibold text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            ))}
          </div>

          <Button type="submit" className="w-full" loading={busy} disabled={code.length !== 6}>
            Verify
          </Button>

          <p className="text-center text-theme-xs text-gray-500 dark:text-gray-400">
            Open your authenticator app (Google Authenticator, Authy, etc.) and enter the current code.
          </p>
        </form>
      </div>
    </div>
  );
}
