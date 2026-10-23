import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { http, setUnauthorizedHandler, ApiError } from "@/lib/api";
import type { AdminUser, PermissionKey } from "@/types/api";

type TwoFactorState = null | "challenge" | "setup";

interface AuthValue {
  user: AdminUser | null;
  ready: boolean;
  can: (permission: PermissionKey) => boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-read the signed-in user (e.g. after changing the email). */
  refresh: () => Promise<void>;
  /** Current 2FA state: null (none), "challenge" (code required), "setup" (enroll required). */
  twoFactorState: TwoFactorState;
  /** Submit the TOTP code to complete a 2FA challenge. */
  verifyTwoFactor: (code: string) => Promise<void>;
  /** Fetch the TOTP secret + otpauth URI for first-time 2FA enrolment. */
  fetchTwoFactorSetup: () => Promise<{ secret: string; uri: string }>;
  /** Confirm the setup by verifying the first TOTP code. */
  confirmTwoFactorSetup: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState>(null);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    http
      .get<AdminUser>("/me")
      .then((me) => setUser(me.role === "customer" ? null : me))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const res = await http.post<{ data?: AdminUser; two_factor?: "challenge" | "setup" }>("/auth/login", { email, password, remember });

    if (res.two_factor) {
      setTwoFactorState(res.two_factor);
      return;
    }

    if (res.data?.role === "customer") {
      await http.post("/auth/logout").catch(() => undefined);
      throw new ApiError("This account does not have admin access.", 403);
    }
    setUser(await http.get<AdminUser>("/me"));
  }, []);

  const logout = useCallback(async () => {
    await http.post("/auth/logout").catch(() => undefined);
    setUser(null);
    setTwoFactorState(null);
  }, []);

  const refresh = useCallback(async () => {
    const me = await http.get<AdminUser>("/me");
    setUser(me.role === "customer" ? null : me);
  }, []);

  const verifyTwoFactor = useCallback(async (code: string) => {
    await http.post("/auth/two-factor/verify", { code });
    setTwoFactorState(null);
    setUser(await http.get<AdminUser>("/me"));
  }, []);

  const fetchTwoFactorSetup = useCallback(async () => {
    const res = await http.get<{ secret: string; uri: string }>("/auth/two-factor/setup");
    return res;
  }, []);

  const confirmTwoFactorSetup = useCallback(async (code: string) => {
    await http.post("/auth/two-factor/confirm-setup", { code });
    setTwoFactorState(null);
    setUser(await http.get<AdminUser>("/me"));
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      can: (permission) => user?.role === "admin" || Boolean(user?.permissions?.includes(permission)),
      login,
      logout,
      refresh,
      twoFactorState,
      verifyTwoFactor,
      fetchTwoFactorSetup,
      confirmTwoFactorSetup,
    }),
    [user, ready, login, logout, refresh, twoFactorState, verifyTwoFactor, fetchTwoFactorSetup, confirmTwoFactorSetup],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
