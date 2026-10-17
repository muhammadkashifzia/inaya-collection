import { Container } from "@/components/atoms";
import { CollectionTile, SectionHeader } from "@/components/molecules";
import type { Collection } from "@/types";

export function ShopByCollection({ title, collections }: { title: string; collections: Collection[] }) {
  return (
    <section className="py-14 md:py-20">
      <Container>
        <SectionHeader title={title} />
        <div className="grid grid-cols-2 gap-x-1 gap-y-5 md:gap-x-2 md:gap-y-8 lg:grid-cols-4">
          {collections.map((c) => (
            <CollectionTile key={c.id} collection={c} />
          ))}
        </div>
      </Container>
    </section>
  );
}
