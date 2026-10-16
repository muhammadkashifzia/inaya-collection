import Link from "next/link";
import { Container, Icon } from "@/components/atoms";
import { NewsletterForm } from "./NewsletterForm";
import type { SiteSettings } from "@/lib/types";

interface FooterProps {
  site: SiteSettings;
}

export function Footer({ site }: FooterProps) {
  /* Split site name for brand styling */
  const words = site.name.split(" ");
  const firstWord = words[0];
  const rest = words.slice(1).join(" ");

  return (
    <footer className="bg-ink text-white">
      <Container className="py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Brand + about */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block font-heading text-xl font-bold tracking-wide">
              <span>{firstWord}</span>
              {rest && <span className="text-brand"> {rest}</span>}
            </Link>
            {site.about && (
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                {site.about}
              </p>
            )}

            {/* Contact */}
            <div className="mt-4 flex flex-col gap-1.5 text-sm text-white/70">
              {site.phone && (
                <a href={`tel:${site.phone}`} className="hover:text-white">
                  {site.phone}
                </a>
              )}
              {site.email && (
                <a href={`mailto:${site.email}`} className="hover:text-white">
                  {site.email}
                </a>
              )}
              {site.hours && <p>{site.hours}</p>}
            </div>
          </div>

          {/* Footer columns */}
          {site.footer.columns.map((col, i) => (
            <div key={i}>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/50">
                {col.heading}
              </h3>
              <ul className="flex flex-col gap-2">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/50">
              Newsletter
            </h3>
            <p className="mb-3 text-sm text-white/70">
              Subscribe for exclusive offers and new arrivals.
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
          {/* Social */}
          {site.social.length > 0 && (
            <div className="flex items-center gap-3">
              {site.social.map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="text-white/50 transition-colors hover:text-white"
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}

          <p className="text-xs text-white/40">{site.footer.copyright}</p>
        </div>
      </Container>
    </footer>
  );
}
