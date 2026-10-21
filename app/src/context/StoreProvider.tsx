"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import type { Cart, Product, User } from "@/types";

/**
 * Client state backed by the Laravel API:
 * - user: the Sanctum session user (null for guests)
 * - cart: server cart (guest token or account), totals computed on the server
 * - wishlist: server wishlist when signed in; a local list for guests that is
 *   synced to the account on sign-in
 */
interface StoreValue {
  user: User | null;
  authReady: boolean;
  cart: Cart | null;
  cartBusy: boolean;
  cartError: string | null;
  count: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  refreshCart: () => Promise<void>;
  addToCart: (variantId: number, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<string | null>;
  removeCoupon: () => Promise<void>;
  setCart: (cart: Cart | null) => void;
  wishlist: number[];
  toggleWishlist: (product: Product) => Promise<void>;
  isWishlisted: (productId: number) => boolean;
  signIn: (email: string, password: string, remember?: boolean) => Promise<User>;
  signUp: (input: { name: string; email: string; phone?: string; password: string; passwordConfirmation: string }) => Promise<User>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const StoreContext = createContext<StoreValue | null>(null);
const GUEST_WISHLIST_KEY = "gw-wishlist";

function readGuestWishlist(): number[] {
  try {
    const raw = window.localStorage.getItem(GUEST_WISHLIST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function writeGuestWishlist(ids: number[]) {
  try {
    window.localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartBusy, setCartBusy] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [isCartOpen, setCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const userRef = useRef<User | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const refreshCart = useCallback(async () => {
    try {
      setCart(await api.cart());
      setCartError(null);
    } catch (error) {
      setCartError(error instanceof ApiError ? error.message : "Could not load your cart.");
    }
  }, []);

  const loadWishlist = useCallback(async (signedIn: User | null) => {
    if (!signedIn) {
      setWishlist(readGuestWishlist());
      return;
    }
    // Move any guest wishlist items into the account, then load from the server.
    const guestIds = readGuestWishlist();
    if (guestIds.length) {
      await Promise.allSettled(guestIds.map((id) => api.addToWishlist(id)));
      writeGuestWishlist([]);
    }
    try {
      setWishlist((await api.wishlist()).ids);
    } catch {
      setWishlist([]);
    }
  }, []);

  // Initial session + cart load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await api.me().catch(() => null);
      if (cancelled) return;
      setUser(me);
      setAuthReady(true);
      await Promise.all([refreshCart(), loadWishlist(me)]);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshCart, loadWishlist]);

  const runCart = useCallback(async (operation: () => Promise<Cart>): Promise<string | null> => {
    setCartBusy(true);
    try {
      setCart(await operation());
      setCartError(null);
      return null;
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      setCartError(message);
      return message;
    } finally {
      setCartBusy(false);
    }
  }, []);

  const addToCart = useCallback(
    async (variantId: number, quantity = 1) => {
      const error = await runCart(() => api.addToCart(variantId, quantity));
      if (error === null) {
        toast.success("Added to Cart", "Item has been added to your bag.");
        setCartOpen(true);
      } else {
        toast.error("Cart Error", error);
      }
      return error === null;
    },
    [runCart, toast],
  );

  const wishlistRef = useRef<number[]>([]);
  useEffect(() => {
    wishlistRef.current = wishlist;
  }, [wishlist]);

  const toggleWishlist = useCallback(async (product: Product) => {
    const signedIn = userRef.current;
    const wasSaved = wishlistRef.current.includes(product.id);
    const next = wasSaved ? wishlistRef.current.filter((id) => id !== product.id) : [...wishlistRef.current, product.id];

    // Optimistic update.
    wishlistRef.current = next;
    setWishlist(next);
    toast.success(wasSaved ? "Removed from Wishlist" : "Added to Wishlist", wasSaved ? "Item has been removed." : "Item saved to your wishlist.");

    if (!signedIn) {
      writeGuestWishlist(next);
      return;
    }
    try {
      if (wasSaved) await api.removeFromWishlist(product.id);
      else await api.addToWishlist(product.id);
    } catch {
      const reverted = wasSaved ? [...wishlistRef.current, product.id] : wishlistRef.current.filter((id) => id !== product.id);
      wishlistRef.current = reverted;
      setWishlist(reverted);
      toast.error("Wishlist Error", "Could not update wishlist. Please try again.");
    }
  }, [toast]);

  const signIn = useCallback(
    async (email: string, password: string, remember = false) => {
      const signedIn = await api.login(email, password, remember);
      setUser(signedIn);
      await Promise.all([refreshCart(), loadWishlist(signedIn)]);
      return signedIn;
    },
    [refreshCart, loadWishlist],
  );

  const signUp = useCallback<StoreValue["signUp"]>(
    async (input) => {
      const created = await api.register(input);
      setUser(created);
      await Promise.all([refreshCart(), loadWishlist(created)]);
      return created;
    },
    [refreshCart, loadWishlist],
  );

  const signOut = useCallback(async () => {
    await api.logout().catch(() => undefined);
    setUser(null);
    setCart(null);
    setWishlist([]);
    await refreshCart();
  }, [refreshCart]);

  const value = useMemo<StoreValue>(
    () => ({
      user,
      authReady,
      cart,
      cartBusy,
      cartError,
      count: cart?.itemCount ?? 0,
      isCartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      refreshCart,
      addToCart,
      updateQuantity: async (itemId, quantity) => {
        const err = await runCart(() => api.updateCartItem(itemId, quantity));
        if (err !== null) toast.error("Update Failed", err);
      },
      removeFromCart: async (itemId) => {
        const err = await runCart(() => api.removeCartItem(itemId));
        if (err === null) toast.success("Item Removed", "Item has been removed from your cart.");
        else toast.error("Cart Error", err);
      },
      applyCoupon: async (code) => {
        const err = await runCart(() => api.applyCoupon(code));
        if (err === null) toast.success("Coupon Applied", "Discount has been applied to your order.");
        else toast.error("Invalid Coupon", err);
        return err;
      },
      removeCoupon: async () => {
        const err = await runCart(() => api.removeCoupon());
        if (err === null) toast.success("Coupon Removed", "Discount code has been removed.");
        else toast.error("Error", err);
      },
      setCart,
      wishlist,
      toggleWishlist,
      isWishlisted: (id) => wishlist.includes(id),
      signIn,
      signUp,
      signOut,
      setUser,
    }),
    [user, authReady, cart, cartBusy, cartError, isCartOpen, refreshCart, addToCart, runCart, wishlist, toggleWishlist, signIn, signUp, signOut],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
