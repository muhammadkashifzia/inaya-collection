"use client";

import { cn } from "@/lib/utils";
import { IconButton } from "@/components/atoms";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";

interface WishlistButtonProps {
  product: Product;
  className?: string;
}

export function WishlistButton({ product, className }: WishlistButtonProps) {
  const { toggleWishlist, isWishlisted } = useStore();
  const liked = isWishlisted(product.id);

  return (
    <IconButton
      icon="heart"
      label={liked ? "Remove from wishlist" : "Add to wishlist"}
      filled={liked}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);
      }}
      className={cn(
        liked ? "text-brand" : "text-ink/60 hover:text-brand",
        className,
      )}
    />
  );
}
