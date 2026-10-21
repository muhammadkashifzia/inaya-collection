import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { Notice } from "@/components/admin/Fields";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

/**
 * AWS-style forced MFA enrollment. Shown after password auth when the
 * staff member has not yet configured an authenticator app.
 */
export default function TwoFactorSetupForm() {
  const { confirmTwoFactorSetup, fetchTwoFactorSetup, twoFactorState, user, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [copied, setCopied] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fetched = useRef(false);

  // If user is logged in or not in setup state, redirect away.
  if (ready && user) return <Navigate to={from} replace />;
  if (ready && twoFactorState !== "setup") return <Navigate to="/signin" replace />;

  // Fetch the TOTP secret on mount.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchTwoFactorSetup()
      .then(setSetup)
      .catch(() => setError(new ApiError("Could not start 2FA setup. Please sign in again.", 0)))
      .finally(() => setLoadingSetup(false));
  }, [fetchTwoFactorSetup]);

  const code = digits.join("");

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
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
    for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? "";
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  function copySecret() {
    if (!setup) return;
    navigator.clipboard.writeText(setup.secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => undefined);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await confirmTwoFactorSetup(code);
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
        <div className="mb-6">
          <h1 className="mb-2 font-display text-title-sm font-semibold text-ink-900 dark:text-white/90">Set up authenticator</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your account requires multi-factor authentication. Scan the QR code below with an authenticator app to continue.
          </p>
        </div>

        {loadingSetup ? (
          <div className="flex justify-center py-12">
            <span className="animate-pulse text-sm text-gray-400">Loading…</span>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            <Notice tone="error">{error ? (error.field("code") ?? error.message) : null}</Notice>

            {setup && (
              <>
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700">
                    <QRCodeSVG value={setup.uri} size={180} level="M" marginSize={0} />
                  </div>
                </div>

                {/* Manual key fallback */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowManual(!showManual)}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showManual ? "Hide manual key" : "Can't scan? Enter key manually"}
                  </button>
                </div>

                {showManual && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Secret key</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs tracking-widest break-all select-all text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90">
                        {setup.secret}
                      </code>
                      <button
                        type="button"
                        onClick={copySecret}
                        className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
                      >
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* OTP entry */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Verification code</p>
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
            </div>

            <Button type="submit" className="w-full" loading={busy} disabled={code.length !== 6}>
              Verify & activate
            </Button>

            <p className="text-center text-theme-xs text-gray-400 dark:text-gray-500">
              Use Google Authenticator, Authy, 1Password, or any TOTP-compatible app.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
