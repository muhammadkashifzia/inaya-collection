"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { api } from "@/lib/api";
import type { Cart, Product, User } from "@/lib/types";

/* ── State ── */

interface StoreState {
  cart: Cart | null;
  cartOpen: boolean;
  cartLoading: boolean;
  user: User | null;
  wishlistIds: Set<number>;
}

const initial: StoreState = {
  cart: null,
  cartOpen: false,
  cartLoading: false,
  user: null,
  wishlistIds: new Set(),
};

/* ── Actions ── */

type Action =
  | { type: "SET_CART"; cart: Cart }
  | { type: "SET_CART_LOADING"; loading: boolean }
  | { type: "OPEN_CART" }
  | { type: "CLOSE_CART" }
  | { type: "SET_USER"; user: User | null }
  | { type: "SET_WISHLIST_IDS"; ids: number[] }
  | { type: "TOGGLE_WISHLIST_ID"; id: number };

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "SET_CART":
      return { ...state, cart: action.cart, cartLoading: false };
    case "SET_CART_LOADING":
      return { ...state, cartLoading: action.loading };
    case "OPEN_CART":
      return { ...state, cartOpen: true };
    case "CLOSE_CART":
      return { ...state, cartOpen: false };
    case "SET_USER":
      return { ...state, user: action.user };
    case "SET_WISHLIST_IDS":
      return { ...state, wishlistIds: new Set(action.ids) };
    case "TOGGLE_WISHLIST_ID": {
      const next = new Set(state.wishlistIds);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, wishlistIds: next };
    }
    default:
      return state;
  }
}

/* ── Context ── */

interface StoreContextValue extends StoreState {
  openCart: () => void;
  closeCart: () => void;
  addToCart: (variantId: number, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  refreshCart: () => Promise<void>;
  setUser: (user: User | null) => void;
  toggleWishlist: (product: Product) => Promise<void>;
  isWishlisted: (productId: number) => boolean;
}

const StoreContext = createContext<StoreContextValue | null>(null);

/* ── Provider ── */

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const mounted = useRef(false);

  /* Hydrate on mount */
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    api.cart().then((c) => dispatch({ type: "SET_CART", cart: c })).catch(() => {});
    api.me().then((u) => {
      dispatch({ type: "SET_USER", user: u });
      if (u) {
        api.wishlist().then((w) => dispatch({ type: "SET_WISHLIST_IDS", ids: w.ids })).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const openCart = useCallback(() => dispatch({ type: "OPEN_CART" }), []);
  const closeCart = useCallback(() => dispatch({ type: "CLOSE_CART" }), []);

  const refreshCart = useCallback(async () => {
    try {
      const c = await api.cart();
      dispatch({ type: "SET_CART", cart: c });
    } catch { /* ignore */ }
  }, []);

  const addToCart = useCallback(async (variantId: number, quantity = 1) => {
    dispatch({ type: "SET_CART_LOADING", loading: true });
    try {
      const c = await api.addToCart(variantId, quantity);
      dispatch({ type: "SET_CART", cart: c });
      dispatch({ type: "OPEN_CART" });
    } finally {
      dispatch({ type: "SET_CART_LOADING", loading: false });
    }
  }, []);

  const updateQuantity = useCallback(async (itemId: number, quantity: number) => {
    try {
      const c = await api.updateCartItem(itemId, quantity);
      dispatch({ type: "SET_CART", cart: c });
    } catch { /* ignore */ }
  }, []);

  const removeFromCart = useCallback(async (itemId: number) => {
    try {
      const c = await api.removeCartItem(itemId);
      dispatch({ type: "SET_CART", cart: c });
    } catch { /* ignore */ }
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    const c = await api.applyCoupon(code);
    dispatch({ type: "SET_CART", cart: c });
  }, []);

  const removeCoupon = useCallback(async () => {
    const c = await api.removeCoupon();
    dispatch({ type: "SET_CART", cart: c });
  }, []);

  const setUser = useCallback((user: User | null) => {
    dispatch({ type: "SET_USER", user });
    if (user) {
      api.wishlist().then((w) => dispatch({ type: "SET_WISHLIST_IDS", ids: w.ids })).catch(() => {});
    } else {
      dispatch({ type: "SET_WISHLIST_IDS", ids: [] });
    }
  }, []);

  const toggleWishlist = useCallback(async (product: Product) => {
    const isLiked = state.wishlistIds.has(product.id);
    dispatch({ type: "TOGGLE_WISHLIST_ID", id: product.id });
    try {
      if (isLiked) {
        await api.removeFromWishlist(product.id);
      } else {
        await api.addToWishlist(product.id);
      }
    } catch {
      dispatch({ type: "TOGGLE_WISHLIST_ID", id: product.id });
    }
  }, [state.wishlistIds]);

  const isWishlisted = useCallback(
    (productId: number) => state.wishlistIds.has(productId),
    [state.wishlistIds],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      ...state,
      openCart,
      closeCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      applyCoupon,
      removeCoupon,
      refreshCart,
      setUser,
      toggleWishlist,
      isWishlisted,
    }),
    [state, openCart, closeCart, addToCart, updateQuantity, removeFromCart, applyCoupon, removeCoupon, refreshCart, setUser, toggleWishlist, isWishlisted],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/* ── Hook ── */

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}
