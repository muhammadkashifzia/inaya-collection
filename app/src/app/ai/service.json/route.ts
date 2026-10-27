import { NextResponse } from "next/server";
import { getSite } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

export async function GET() {
  const site = await getSite();
  const base = siteUrl();

  return NextResponse.json(
    {
      name: site.name,
      type: "OnlineStore",
      url: base,
      description: site.seo.defaultDescription || site.about,
      services: [
        {
          name: "Online Shopping",
          description: `Browse and purchase unstitched suits and premium fabrics from ${site.name}.`,
          url: `${base}/collections/all`,
        },
        {
          name: "Product Search",
          description: "Search our full product catalog by name, fabric, or style.",
          url: `${base}/search`,
        },
        ...(site.freeShippingThreshold
          ? [{
              name: "Free Shipping",
              description: `Free shipping on orders above PKR ${site.freeShippingThreshold.toLocaleString()}.`,
            }]
          : []),
      ],
      contact: {
        ...(site.email ? { email: site.email } : {}),
        ...(site.phone ? { phone: site.phone } : {}),
        ...(site.whatsapp ? { whatsapp: site.whatsapp } : {}),
      },
      shipping: {
        methods: site.shippingMethods.map((m) => ({
          name: m.name,
          fee: m.fee > 0 ? `PKR ${m.fee}` : "Free",
        })),
        ...(site.freeShippingThreshold ? { freeAbove: `PKR ${site.freeShippingThreshold}` } : {}),
      },
      payment: site.paymentMethods.map((m) => m.name),
    },
    { headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } },
  );
}
