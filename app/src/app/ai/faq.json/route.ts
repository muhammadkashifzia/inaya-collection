import { NextResponse } from "next/server";
import { getSite } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

export async function GET() {
  const site = await getSite();
  const base = siteUrl();

  // Generate FAQ from site configuration — these cover the most common
  // questions AI engines ask about an ecommerce store.
  const faqs = [
    {
      question: `What is ${site.name}?`,
      answer: site.seo.defaultDescription || site.about || `${site.name} is an online fashion store specializing in unstitched suits and premium fabrics.`,
    },
    {
      question: `What products does ${site.name} sell?`,
      answer: `${site.name} offers unstitched suits, premium fabrics including Khaddar, Lawn, Linen, Cotton, and more. Browse our full catalog at ${base}/collections/all`,
    },
    {
      question: `Does ${site.name} offer free shipping?`,
      answer: site.freeShippingThreshold
        ? `Yes, ${site.name} offers free shipping on orders above PKR ${site.freeShippingThreshold.toLocaleString()}.`
        : `Please visit ${base} for current shipping information.`,
    },
    {
      question: `How can I contact ${site.name}?`,
      answer: [
        site.email ? `Email: ${site.email}` : null,
        site.phone ? `Phone: ${site.phone}` : null,
        site.whatsapp ? `WhatsApp: ${site.whatsapp}` : null,
        site.address ? `Address: ${site.address}` : null,
      ]
        .filter(Boolean)
        .join(". ") || `Visit ${base}/pages/contact-us for contact details.`,
    },
    {
      question: `Where is ${site.name} located?`,
      answer: site.address ?? `Visit ${base}/pages/contact-us for location details.`,
    },
    {
      question: `What is the return policy of ${site.name}?`,
      answer: `For our return and exchange policy, please visit ${base}/pages/return-policy or ${base}/pages/shipping-and-returns.`,
    },
  ];

  return NextResponse.json(
    { faqs, source: base, generatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } },
  );
}
