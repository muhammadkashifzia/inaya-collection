"use client";

import { useState } from "react";
import { Button } from "@/components/atoms";
import { useStore } from "@/lib/store";

interface AddToCartButtonProps {
  variantId: number | null;
  available: boolean;
  quantity?: number;
  size?: "sm" | "lg";
  label?: string;
}

export function AddToCartButton({
  variantId,
  available,
  quantity = 1,
  size = "lg",
  label = "Add to Cart",
}: AddToCartButtonProps) {
  const { addToCart } = useStore();
  const [loading, setLoading] = useState(false);

  const disabled = !available || variantId == null || loading;

  const handleClick = async () => {
    if (variantId == null) return;
    setLoading(true);
    try {
      await addToCart(variantId, quantity);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="primary"
      size={size}
      fullWidth
      disabled={disabled}
      onClick={handleClick}
      aria-busy={loading}
    >
      {loading ? "Adding…" : !available ? "Sold Out" : label}
    </Button>
  );
}
