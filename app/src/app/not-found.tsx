import { ButtonLink, Container, Heading } from "@/components/atoms";

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <Heading level={1} align="center">Page not found</Heading>
      <p className="mb-8 mt-3 text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <ButtonLink href="/">Back to home</ButtonLink>
    </Container>
  );
}
