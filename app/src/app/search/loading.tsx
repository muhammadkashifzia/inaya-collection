import { Container } from "@/components/atoms";

/** Skeleton shown while search results stream. */
export default function SearchLoading() {
  return (
    <Container className="py-10 md:py-14">
      <div className="mb-6 h-8 w-52 animate-pulse bg-cream" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[3/4] animate-pulse rounded bg-cream" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-cream" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-cream" />
          </div>
        ))}
      </div>
    </Container>
  );
}
