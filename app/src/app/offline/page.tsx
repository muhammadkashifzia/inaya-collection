import type { Metadata } from "next";
import { ButtonLink, Container, Heading } from "@/components/atoms";

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

/** Shown by the service worker when a page is requested without a network connection. */
export default function OfflinePage() {
  return (
    <Container className="py-24 text-center">
      <Heading level={1} align="center">You&apos;re offline</Heading>
      <p className="mb-8 mt-3 text-muted">Check your internet connection and try again. Pages you visited recently are still available.</p>
      <ButtonLink href="/">Try again</ButtonLink>
    </Container>
  );
}
