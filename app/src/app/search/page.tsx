import type { Metadata } from "next";
import { Suspense } from "react";
import { Container, Heading } from "@/components/atoms";
import { ProductGridSkeleton } from "@/components/organisms";
import { SearchResults } from "./SearchResults";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <Container className="py-12">
      <Heading level={1} className="mb-6">Search</Heading>
      <Suspense fallback={<ProductGridSkeleton />}>
        <SearchResults />
      </Suspense>
    </Container>
  );
}
