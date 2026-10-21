import { Container } from "@/components/atoms";

/** Skeleton for the product detail page while data streams. */
export default function ProductLoading() {
  return (
    <Container className="grid gap-8 py-12 lg:grid-cols-2">
      <div className="aspect-[3/4] animate-pulse bg-cream" />
      <div className="space-y-4">
        <div className="h-8 w-3/4 animate-pulse bg-cream" />
        <div className="h-6 w-1/3 animate-pulse bg-cream" />
        <div className="h-4 w-full animate-pulse bg-cream" />
        <div className="h-4 w-5/6 animate-pulse bg-cream" />
        <div className="h-12 w-48 animate-pulse rounded bg-cream" />
      </div>
    </Container>
  );
}
