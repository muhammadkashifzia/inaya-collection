import type { ReactNode } from "react";
import { Container, Heading } from "@/components/atoms";
import type { ContentPage } from "@/types";

/**
 * CMS page. Section bodies are plain text from the admin and are rendered
 * escaped (React default), so no HTML injection is possible.
 */
export function ContentPageTemplate({ page, children }: { page: ContentPage; children?: ReactNode }) {
  return (
    <Container className="max-w-3xl py-12 md:py-16">
      <Heading level={1} align="center" className="mb-10">{page.title}</Heading>
      <div className="space-y-6">
        {page.sections.map((s, i) => (
          <section key={i}>
            {s.heading && <h2 className="mb-2 font-heading text-lg font-semibold">{s.heading}</h2>}
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink/80">{s.body}</p>
          </section>
        ))}
      </div>
      {children && <div className="mt-10">{children}</div>}
    </Container>
  );
}
