import { ProductCard } from "@/components/molecules";
import type { Product } from "@/lib/types";

interface ProductGridProps {
  products: Product[];
  emptyText?: string;
  trailing?: React.ReactNode;
}

export function ProductGrid({
  products,
  emptyText = "No products found.",
  trailing,
}: ProductGridProps) {
  if (products.length === 0 && !trailing) {
    return (
      <p className="py-12 text-center text-muted">{emptyText}</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
      {trailing}
    </div>
  );
}
