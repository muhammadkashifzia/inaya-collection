import { Container } from "@/components/atoms";
import { TrustBadge } from "@/components/molecules";
import type { TrustItem } from "@/types";

export function TrustBar({ items }: { items: TrustItem[] }) {
  return (
    <section aria-label="Why shop with us" className="bg-cream">
      <Container className="grid grid-cols-2 divide-line md:grid-cols-4 md:divide-x">
        {items.map((item) => (
          <TrustBadge key={item.title} item={item} />
        ))}
      </Container>
    </section>
  );
}
