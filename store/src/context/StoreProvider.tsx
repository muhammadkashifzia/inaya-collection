"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api } from "@/lib/api";
import type { Cart, User } from "@/lib/types";

/* ── localStorage helpers ── */

const GW_KEY = "gw-wishlist";

function readGuestWishlist(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GW_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function writeGuestWishlist(ids: number[]): void {
  try {
    localStorage.setItem(GW_KEY, JSON.stringify(ids));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

/* ── Context shape ── */

interface StoreContextValue {
  /* auth */
  user: User | null;
  authReady: boolean;
  signIn: (email: string, password: string, remember?: boolean) => Promise<User>;
  signUp: (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    passwordConfirmation: string;
  }) => Promise<User>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;

  /* cart */
  cart: Cart | null;
  cartBusy: boolean;
  cartError: string | null;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  refreshCart: () => Promise<void>;
  addToCart: (variantId: number, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  setCart: (cart: Cart | null) => void;

  /* wishlist */
  wishlist: number[];
  toggleWishlist: (productId: number) => void;
  isWishlisted: (productId: number) => boolean;
}

const StoreContext = createContext<StoreContextValue | null>(null);

/* ── Provider ── */

export function StoreProvider({ children }: { children: React.ReactNode }) {
  /* auth state */
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  /* cart state */
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartBusy, setCartBusy] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  /* wishlist state */
  const [wishlist, setWishlist] = useState<number[]>([]);

  /* prevent double-init in strict mode */
  const initRef = useRef(false);

  /* ── Cart actions ── */

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const refreshCart = useCallback(async () => {
    try {
      const c = await api.cart();
      setCart(c);
    } catch {
      /* network error — keep stale cart */
    }
  }, []);

  const addToCart = useCallback(
    async (variantId: number, quantity = 1) => {
      setCartBusy(true);
      setCartError(null);
      try {
        const c = await api.addToCart(variantId, quantity);
        setCart(c);
        setIsCartOpen(true);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Could not add to cart";
        setCartError(msg);
      } finally {
        setCartBusy(false);
      }
    },
    [],
  );

  const updateQuantity = useCallback(
    async (itemId: number, quantity: number) => {
      setCartBusy(true);
      setCartError(null);
      try {
        const c = await api.updateCartItem(itemId, quantity);
        setCart(c);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Could not update item";
        setCartError(msg);
      } finally {
        setCartBusy(false);
      }
    },
    [],
  );

  const removeFromCart = useCallback(async (itemId: number) => {
    setCartBusy(true);
    setCartError(null);
    try {
      const c = await api.removeCartItem(itemId);
      setCart(c);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not remove item";
      setCartError(msg);
    } finally {
      setCartBusy(false);
    }
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    setCartBusy(true);
    setCartError(null);
    try {
      const c = await api.applyCoupon(code);
      setCart(c);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Invalid coupon code";
      setCartError(msg);
    } finally {
      setCartBusy(false);
    }
  }, []);

  const removeCoupon = useCallback(async () => {
    setCartBusy(true);
    setCartError(null);
    try {
      const c = await api.removeCoupon();
      setCart(c);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not remove coupon";
      setCartError(msg);
    } finally {
      setCartBusy(false);
    }
  }, []);

  /* ── Wishlist actions ── */

  const syncWishlistToServer = useCallback(
    async (guestIds: number[]) => {
      for (const id of guestIds) {
        try {
          await api.addToWishlist(id);
        } catch {
          /* individual sync failures are non-critical */
        }
      }
      /* after sync, fetch the canonical server list */
      try {
        const { ids } = await api.wishlist();
        setWishlist(ids);
      } catch {
        /* keep local list */
      }
      /* clear guest storage */
      writeGuestWishlist([]);
    },
    [],
  );

  const toggleWishlist = useCallback(
    (productId: number) => {
      setWishlist((prev) => {
        const exists = prev.includes(productId);
        const next = exists
          ? prev.filter((id) => id !== productId)
          : [...prev, productId];

        if (user) {
          /* fire-and-forget server call */
          if (exists) {
            api.removeFromWishlist(productId).catch(() => {});
          } else {
            api.addToWishlist(productId).catch(() => {});
          }
        } else {
          writeGuestWishlist(next);
        }

        return next;
      });
    },
    [user],
  );

  const isWishlisted = useCallback(
    (productId: number) => wishlist.includes(productId),
    [wishlist],
  );

  /* ── Auth actions ── */

  const signIn = useCallback(
    async (email: string, password: string, remember = false): Promise<User> => {
      const u = await api.login(email, password, remember);
      setUser(u);
      /* merge guest wishlist */
      const guestIds = readGuestWishlist();
      if (guestIds.length > 0) {
        syncWishlistToServer(guestIds);
      } else {
        api.wishlist().then(({ ids }) => setWishlist(ids)).catch(() => {});
      }
      refreshCart();
      return u;
    },
    [refreshCart, syncWishlistToServer],
  );

  const signUp = useCallback(
    async (data: {
      name: string;
      email: string;
      phone?: string;
      password: string;
      passwordConfirmation: string;
    }): Promise<User> => {
      const u = await api.register(data);
      setUser(u);
      const guestIds = readGuestWishlist();
      if (guestIds.length > 0) {
        syncWishlistToServer(guestIds);
      } else {
        api.wishlist().then(({ ids }) => setWishlist(ids)).catch(() => {});
      }
      refreshCart();
      return u;
    },
    [refreshCart, syncWishlistToServer],
  );

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* ignore logout errors */
    }
    setUser(null);
    setCart(null);
    setWishlist([]);
    writeGuestWishlist([]);
  }, []);

  /* ── Initialization ── */

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    (async () => {
      /* 1. check session */
      const currentUser = await api.me();
      setUser(currentUser);
      setAuthReady(true);

      /* 2. refresh cart */
      try {
        const c = await api.cart();
        setCart(c);
      } catch {
        /* no cart yet */
      }

      /* 3. load wishlist */
      if (currentUser) {
        const guestIds = readGuestWishlist();
        if (guestIds.length > 0) {
          /* bulk sync guest → server */
          for (const id of guestIds) {
            try {
              await api.addToWishlist(id);
            } catch {
              /* skip */
            }
          }
          writeGuestWishlist([]);
        }
        try {
          const { ids } = await api.wishlist();
          setWishlist(ids);
        } catch {
          /* keep empty */
        }
      } else {
        setWishlist(readGuestWishlist());
      }
    })();
  }, []);

  /* ── Memoized value ── */

  const value = useMemo<StoreContextValue>(
    () => ({
      user,
      authReady,
      signIn,
      signUp,
      signOut,
      setUser,
      cart,
      cartBusy,
      cartError,
      isCartOpen,
      openCart,
      closeCart,
      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      applyCoupon,
      removeCoupon,
      setCart,
      wishlist,
      toggleWishlist,
      isWishlisted,
    }),
    [
      user,
      authReady,
      signIn,
      signUp,
      signOut,
      cart,
      cartBusy,
      cartError,
      isCartOpen,
      openCart,
      closeCart,
      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      applyCoupon,
      removeCoupon,
      wishlist,
      toggleWishlist,
      isWishlisted,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

/* ── Hook ── */

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within <StoreProvider>");
  }
  return ctx;
}
