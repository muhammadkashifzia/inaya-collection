"use client";

import Link from "next/link";
import { AppImage, IconButton } from "@/components/atoms";
import { useStore } from "@/context/StoreProvider";
import { formatPrice } from "@/lib/format";
import type { CartLine } from "@/types";
import { QuantitySelector } from "./QuantitySelector";

export function CartLineItem({ item, onNavigate, issue }: { item: CartLine; onNavigate?: () => void; issue?: string }) {
  const { updateQuantity, removeFromCart, cartBusy } = useStore();
  const onSale = item.unitPrice < item.regularPrice;

  return (
    <li className="flex gap-3 py-3 sm:gap-4 sm:py-4">
      <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-cream sm:h-24 sm:w-20">
        <AppImage src={item.image} alt="" fill sizes="80px" className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 sm:gap-2">
        <Link href={`/products/${item.slug}`} onClick={onNavigate} className="text-xs leading-snug hover:text-brand sm:text-sm">
          {item.name}
          {item.variantName && <span className="block text-xs text-muted">{item.variantName}</span>}
        </Link>
        <p className="flex items-baseline gap-2 text-sm font-semibold">
          {formatPrice(item.unitPrice)}
          {onSale && <s className="text-xs font-medium text-muted">{formatPrice(item.regularPrice)}</s>}
        </p>
        {issue && (
          <p role="alert" className="text-xs font-semibold text-error">
            {issue}
          </p>
        )}
        <div className="flex items-center justify-between">
          <QuantitySelector
            value={item.quantity}
            max={Math.max(item.maxQuantity, 1)}
            disabled={cartBusy}
            onChange={(q) => void updateQuantity(item.id, q)}
            label={`Quantity for ${item.name}`}
          />
          <IconButton
            icon="trash"
            size={18}
            label={`Remove ${item.name}`}
            disabled={cartBusy}
            onClick={() => void removeFromCart(item.id)}
          />
        </div>
      </div>
    </li>
  );
}
