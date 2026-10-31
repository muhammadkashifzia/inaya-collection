import { cn, formatPrice } from "@/lib/format";

interface PriceProps {
  price: number;
  compareAtPrice?: number | null;
  size?: "sm" | "lg";
  className?: string;
}

export function Price({ price, compareAtPrice, size = "sm", className }: PriceProps) {
  const onSale = !!compareAtPrice && compareAtPrice > price;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn("font-semibold", onSale ? "text-brand" : "text-ink", size === "lg" ? "text-xl sm:text-2xl" : "text-sm")}>
        <span className="sr-only">{onSale ? "Sale price " : "Price "}</span>
        {formatPrice(price)}
      </span>
      {onSale && (
        <s className={cn("text-muted", size === "lg" ? "text-sm sm:text-base" : "text-xs")}>
          <span className="sr-only">Regular price </span>
          {formatPrice(compareAtPrice)}
        </s>
      )}
    </div>
  );
}
