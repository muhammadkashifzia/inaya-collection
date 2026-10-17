"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/atoms";
import { useStore } from "@/context/StoreProvider";

interface AddToCartButtonProps {
  variantId: number | null;
  available: boolean;
  quantity?: number;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function AddToCartButton({ variantId, available, quantity = 1, size = "sm", label = "Add to cart" }: AddToCartButtonProps) {
  const { addToCart } = useStore();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      fullWidth
      size={size}
      variant="secondary"
      disabled={!available || variantId === null || busy}
      aria-busy={busy}
      onClick={async () => {
        if (variantId === null) return;
        setBusy(true);
        await addToCart(variantId, quantity);
        setBusy(false);
      }}
    >
      <Icon name="bag" size={16} />
      {!available ? "Sold out" : busy ? "Adding…" : label}
    </Button>
  );
}
