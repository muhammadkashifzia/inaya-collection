"use client";

import { useState } from "react";
import { useStore } from "@/context/StoreProvider";

export function CouponForm() {
  const { cart, applyCoupon, removeCoupon, cartBusy } = useStore();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (cart?.couponCode) {
    return (
      <div className="flex items-center justify-between gap-3 bg-white px-3 py-2 text-sm">
        <span>
          Coupon <strong>{cart.couponCode}</strong>
          {cart.couponError && <span className="block text-xs font-semibold text-error">{cart.couponError}</span>}
        </span>
        <button type="button" onClick={() => void removeCoupon()} disabled={cartBusy} className="text-xs font-semibold uppercase underline">
          Remove
        </button>
      </div>
    );
  }

  const handleApply = async () => {
    if (!code.trim()) return;
    const message = await applyCoupon(code.trim());
    setError(message);
    if (!message) setCode("");
  };

  return (
    <div
      className="space-y-1"
      role="group"
      aria-label="Discount code"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          void handleApply();
        }
      }}
    >
      <label htmlFor="coupon" className="text-xs font-semibold uppercase tracking-widest">Discount code</label>
      <div className="flex gap-2">
        <input
          id="coupon"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={50}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "coupon-error" : undefined}
          className="h-10 flex-1 border border-line bg-white px-3 text-sm uppercase"
        />
        <button type="button" onClick={() => void handleApply()} disabled={cartBusy} className="h-10 bg-ink px-4 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-60">
          Apply
        </button>
      </div>
      {error && <p id="coupon-error" role="alert" className="text-xs font-semibold text-error">{error}</p>}
    </div>
  );
}
