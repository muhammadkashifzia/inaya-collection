"use client";

import { Icon } from "@/components/atoms";
import { useStore } from "@/context/StoreProvider";
import { cn } from "@/lib/format";
import type { Product } from "@/types";

/** Round white heart button. Fills red when the product is saved. */
export function WishlistButton({ product, className }: { product: Product; className?: string }) {
  const { isWishlisted, toggleWishlist } = useStore();
  const saved = isWishlisted(product.id);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
      onClick={() => void toggleWishlist(product)}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_#0000001f] transition-colors focus-visible:outline-2 focus-visible:outline-brand",
        saved ? "text-[#e31c23]" : "text-[#222]",
        className,
      )}
    >
      <Icon
        name="heart"
        size={22}
        strokeWidth={1.6}
        filled={saved}
        className="transition-[fill,transform] duration-300 [transition-timing-function:cubic-bezier(.785,.135,.15,.86)] hover:scale-110"
      />
    </button>
  );
}
