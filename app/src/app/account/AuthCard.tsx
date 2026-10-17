import type { ReactNode } from "react";
import { Container, Heading } from "@/components/atoms";

export function AuthCard({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <Container className="max-w-md py-12 md:py-16">
      <Heading level={1} align="center" className="mb-8">{title}</Heading>
      <div className="border border-line p-6 md:p-8">{children}</div>
      {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
    </Container>
  );
}

/** Only allow same-site relative redirects after sign-in (no open redirects). */
export function safeNext(next: string | null, fallback = "/account"): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
