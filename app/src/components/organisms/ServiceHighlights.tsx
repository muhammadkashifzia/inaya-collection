import type { ReactNode } from "react";
import { Container } from "@/components/atoms";

type Highlight = { title: string; text: string; icon: ReactNode };

const svgProps = {
  width: 44,
  height: 44,
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

const icons = {
  box: (
    <svg {...svgProps}>
      <path d="M6 16 12 6h24l6 10" />
      <rect x="6" y="16" width="36" height="26" />
      <path d="M20 6v16l4-2 4 2V6" />
      <path d="M14 36v-5m-2 2 2-2 2 2M20 36v-5m-2 2 2-2 2 2" />
    </svg>
  ),
  exchange: (
    <svg {...svgProps}>
      <path d="M40 24a16 16 0 0 1-27.3 11.3M8 24a16 16 0 0 1 27.3-11.3" />
      <path d="M36 6v7h-7M12 42v-7h7" />
      <rect x="17" y="17" width="14" height="14" />
      <path d="M22 17v5l2-1 2 1v-5" />
    </svg>
  ),
  shield: (
    <svg {...svgProps}>
      <path d="M24 4 8 10v12c0 10 7 18 16 22 9-4 16-12 16-22V10L24 4Z" />
      <circle cx="24" cy="24" r="8" />
      <path d="m20.5 24 2.5 2.5 4.5-5" />
    </svg>
  ),
  support: (
    <svg {...svgProps}>
      <circle cx="24" cy="18" r="8" />
      <path d="M13 18a11 11 0 0 1 22 0v4" />
      <rect x="10" y="16" width="4" height="7" rx="1.5" />
      <rect x="34" y="16" width="4" height="7" rx="1.5" />
      <path d="M36 23c0 4-3 6-8 6h-2" />
      <path d="M8 44c0-8 7-13 16-13s16 5 16 13Z" />
      <path d="M20 35l4 4 4-4" />
    </svg>
  ),
};

/** Service promises shown site-wide, directly above the footer. */
export function ServiceHighlights({ freeShippingThreshold }: { freeShippingThreshold: number | null }) {
  const items: Highlight[] = [
    {
      title: "Free Shipping",
      text: freeShippingThreshold
        ? `Free shipping on all orders above PKR ${freeShippingThreshold.toLocaleString("en-PK")}`
        : "Free shipping on all orders",
      icon: icons.box,
    },
    { title: "2 Days Exchange Policy", text: "Easy exchange within 2 days", icon: icons.exchange },
    { title: "Cash on Delivery", text: "Order from anywhere and pay at your doorstep", icon: icons.shield },
    { title: "Customer Centric Support", text: "Customer care with satisfaction on priority.", icon: icons.support },
  ];

  return (
    <section aria-label="Our services" className="border-t border-line bg-[#f7f7f7]">
      <Container className="grid gap-5 py-7 sm:grid-cols-2 sm:gap-6 sm:py-8 lg:grid-cols-4 lg:py-10">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-4">
            <span className="shrink-0 text-ink">{item.icon}</span>
            <div>
              <h3 className="text-sm font-medium text-ink">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{item.text}</p>
            </div>
          </div>
        ))}
      </Container>
    </section>
  );
}
