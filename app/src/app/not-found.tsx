import type { Metadata } from "next";
import { ButtonLink, Container, Heading } from "@/components/atoms";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist or has been moved.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <Heading level={1} align="center">Page not found</Heading>
      <p className="mb-8 mt-3 text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <ButtonLink href="/">Back to home</ButtonLink>
    </Container>
  );
}
