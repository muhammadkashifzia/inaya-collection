import type { ReactNode } from "react";
import { Container, Heading, Icon, type IconName } from "@/components/atoms";
import type { ContentPage, SiteConfig } from "@/types";

interface ContactItem {
  icon: IconName;
  label: string;
  value: string;
  href?: string;
}

/** Contact channels come from the store settings managed in admin → Settings. */
function contactItems(site: SiteConfig): ContactItem[] {
  const items: (ContactItem | null)[] = [
    site.phone ? { icon: "phone", label: "Phone", value: site.phone, href: `tel:${site.phone.replace(/[^\d+]/g, "")}` } : null,
    site.whatsapp
      ? { icon: "chat", label: "WhatsApp", value: site.whatsapp, href: `https://wa.me/${site.whatsapp.replace(/\D/g, "")}` }
      : null,
    site.email ? { icon: "mail", label: "Email", value: site.email, href: `mailto:${site.email}` } : null,
    site.address ? { icon: "map", label: "Address", value: site.address } : null,
    site.hours ? { icon: "clock", label: "Working hours", value: site.hours } : null,
  ];
  return items.filter((i): i is ContactItem => i !== null);
}

/**
 * Contact Us page: CMS intro text and store contact details on one side,
 * the contact form (children) on the other. CMS bodies render escaped.
 */
export function ContactPageTemplate({ page, site, children }: { page: ContentPage; site: SiteConfig; children?: ReactNode }) {
  const items = contactItems(site);

  return (
    <Container className="max-w-6xl py-12 md:py-16">
      <Heading level={1} align="center" className="mb-10">{page.title}</Heading>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-14">
        <div className="space-y-8">
          {page.sections.length > 0 && (
            <div className="space-y-5">
              {page.sections.map((s, i) => (
                <section key={i}>
                  {s.heading && <h2 className="mb-2 font-heading text-lg font-semibold">{s.heading}</h2>}
                  <p className="whitespace-pre-line text-sm leading-relaxed text-ink/80">{s.body}</p>
                </section>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <ul className="divide-y divide-line border border-line" aria-label="Contact details">
              {items.map((item) => (
                <li key={item.label} className="flex items-start gap-4 p-4">
                  <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center bg-cream text-brand">
                    <Icon name={item.icon} size={20} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted">{item.label}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="break-words text-sm font-medium text-ink hover:text-brand"
                        {...(item.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="whitespace-pre-line break-words text-sm font-medium text-ink">{item.value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {site.social.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">Follow us</p>
              <ul className="flex flex-wrap gap-2">
                {site.social.map((s) => (
                  <li key={s.href}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-block border border-line px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hover:border-ink">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>{children}</div>
      </div>
    </Container>
  );
}
