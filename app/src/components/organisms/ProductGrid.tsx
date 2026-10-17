import { ProductCard } from "@/components/molecules";
import type { Product } from "@/types";

interface ProductGridProps {
  products: Product[];
  emptyText?: string;
  /** Optional extra cell rendered after the products (e.g. "Discover more" tile). */
  trailing?: React.ReactNode;
}

export function ProductGrid({ products, emptyText = "No products found.", trailing }: ProductGridProps) {
  if (!products.length) {
    return <p className="py-16 text-center text-muted">{emptyText}</p>;
  }
  return (
    <ul className={gridClass}>
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < 4} />
        </li>
      ))}
      {trailing && <li>{trailing}</li>}
    </ul>
  );
}

const gridClass = "grid grid-cols-2 items-start gap-x-3 gap-y-3.5 md:grid-cols-4 md:gap-[18px]";

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className={gridClass} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="animate-pulse">
          <div className="aspect-[3/4] bg-[#e8e4db]" />
          <div className="mt-3 h-4 w-3/4 bg-[#e8e4db]" />
          <div className="mt-2 h-4 w-1/3 bg-[#e8e4db]" />
        </li>
      ))}
    </ul>
  );
}
