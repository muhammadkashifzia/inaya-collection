import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { http, setUnauthorizedHandler, ApiError } from "@/lib/api";
import type { AdminUser, PermissionKey } from "@/types/api";

interface AuthValue {
  user: AdminUser | null;
  ready: boolean;
  can: (permission: PermissionKey) => boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-read the signed-in user (e.g. after changing the email). */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);

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
    const res = await http.post<{ data?: AdminUser }>("/auth/login", { email, password, remember });

    if (res.data?.role === "customer") {
      await http.post("/auth/logout").catch(() => undefined);
      throw new ApiError("This account does not have admin access.", 403);
    }
    setUser(await http.get<AdminUser>("/me"));
  }, []);

  const logout = useCallback(async () => {
    await http.post("/auth/logout").catch(() => undefined);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const me = await http.get<AdminUser>("/me");
    setUser(me.role === "customer" ? null : me);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      can: (permission) => user?.role === "admin" || Boolean(user?.permissions?.includes(permission)),
      login,
      logout,
      refresh,
    }),
    [user, ready, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
