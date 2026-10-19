import { Container } from "@/components/atoms";

/** Instant skeleton shown while the homepage streams. */
export default function HomeLoading() {
  return (
    <Container className="py-8 md:py-12">
      {/* Hero banner skeleton */}
      <div className="mb-8 aspect-[21/9] w-full animate-pulse rounded-lg bg-cream" />

      {/* Section title */}
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-cream" />

      {/* Product grid skeleton */}
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
