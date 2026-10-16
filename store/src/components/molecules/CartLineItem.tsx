"use client";

import Link from "next/link";
import { cn, formatPrice } from "@/lib/utils";
import { Image, Icon } from "@/components/atoms";
import { QuantitySelector } from "./QuantitySelector";
import { useStore } from "@/lib/store";
import type { CartItem } from "@/lib/types";

interface CartLineItemProps {
  item: CartItem;
  onNavigate: () => void;
  issue?: string;
}

export function CartLineItem({ item, onNavigate, issue }: CartLineItemProps) {
  const { updateQuantity, removeFromCart } = useStore();
  const onSale = item.unitPrice < item.regularPrice;

  return (
    <div className={cn("flex gap-3 py-4", issue && "rounded border border-red-200 bg-red-50/50 p-3")}>
      {/* Image */}
      <Link
        href={`/products/${item.slug}`}
        onClick={onNavigate}
        className="relative h-20 w-[60px] shrink-0 overflow-hidden bg-cream"
      >
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="60px"
          className="object-cover"
        />
      </Link>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/products/${item.slug}`}
              onClick={onNavigate}
              className="block truncate text-sm font-semibold leading-tight hover:underline"
            >
              {item.name}
            </Link>
            {item.variantName && (
              <p className="text-xs text-muted">{item.variantName}</p>
            )}
          </div>
          <button
            type="button"
            aria-label={`Remove ${item.name} from cart`}
            onClick={() => removeFromCart(item.id)}
            className="shrink-0 p-1 text-muted transition-colors hover:text-brand"
          >
            <Icon name="trash" size={16} />
          </button>
        </div>

        {/* Price per unit */}
        <div className="flex items-baseline gap-1.5 text-xs">
          <span className={cn("font-medium", onSale && "text-brand")}>
            {formatPrice(item.unitPrice)}
          </span>
          {onSale && (
            <span className="text-muted line-through">
              {formatPrice(item.regularPrice)}
            </span>
          )}
        </div>

        {/* Quantity + line total */}
        <div className="mt-1 flex items-center justify-between">
          <QuantitySelector
            value={item.quantity}
            onChange={(q) => updateQuantity(item.id, q)}
            min={1}
            max={item.maxQuantity}
            label={`Quantity for ${item.name}`}
          />
          <span className="text-sm font-semibold">{formatPrice(item.lineTotal)}</span>
        </div>

        {/* Issue */}
        {issue && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {issue}
          </p>
        )}
      </div>
    </div>
  );
}
