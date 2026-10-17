"use client";

import { useEffect } from "react";
import { Button, ButtonLink, Container, Heading } from "@/components/atoms";

/** Route-level error boundary: shown when the API is unreachable or a render fails. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-24 text-center">
      <Heading level={1} align="center">Something went wrong</Heading>
      <p className="mb-8 mt-3 text-muted">We couldn&apos;t load this page. Please try again in a moment.</p>
      <div className="flex justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="outline">Back to home</ButtonLink>
      </div>
    </Container>
  );
}
