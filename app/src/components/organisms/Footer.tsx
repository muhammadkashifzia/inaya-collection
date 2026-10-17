import Link from "next/link";
import { Container } from "@/components/atoms";
import { FooterLinks } from "@/components/molecules";
import type { SiteConfig } from "@/types";
import { NewsletterForm } from "./NewsletterForm";

export function Footer({ site }: { site: SiteConfig }) {
  return (
    <footer className="bg-ink pb-24 pt-14 text-white lg:pb-10">
      <Container>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="font-heading text-2xl font-bold uppercase tracking-[0.2em]">
              {site.name}
            </Link>
            {site.about && <p className="mt-4 max-w-sm text-sm text-white/70">{site.about}</p>}
            <address className="mt-6 space-y-1 text-sm not-italic text-white/70">
              {site.phone && (
                <p>
                  Phone:{" "}
                  <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`} className="hover:text-white">
                    {site.phone}
                  </a>
                </p>
              )}
              {site.email && (
                <p>
                  Email:{" "}
                  <a href={`mailto:${site.email}`} className="hover:text-white">
                    {site.email}
                  </a>
                </p>
              )}
              {site.hours && <p>{site.hours}</p>}
            </address>
            <NewsletterForm />
          </div>
          {site.footer.columns.map((col) => (
            <FooterLinks key={col.heading} column={col} />
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/15 pt-6 md:flex-row">
          <p className="text-xs text-white/60">© {site.footer.copyright}</p>
          <ul className="flex gap-5">
            {site.social.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-widest text-white/70 hover:text-white">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
