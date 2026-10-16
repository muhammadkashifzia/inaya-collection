import { cn, formatPrice } from "@/lib/utils";

interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number | null;
  size?: "sm" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "text-sm",
  lg: "text-lg md:text-xl",
} as const;

export function PriceDisplay({
  price,
  compareAtPrice,
  size = "sm",
  className,
}: PriceDisplayProps) {
  const onSale = compareAtPrice != null && compareAtPrice > price;

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-2", sizeClasses[size], className)}>
      <span className={cn("font-semibold", onSale ? "text-brand" : "text-ink")}>
        <span className="sr-only">{onSale ? "Sale price: " : "Price: "}</span>
        {formatPrice(price)}
      </span>
      {onSale && (
        <span className="text-muted line-through">
          <span className="sr-only">Regular price: </span>
          {formatPrice(compareAtPrice)}
        </span>
      )}
    </span>
  );
}
