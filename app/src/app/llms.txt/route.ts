import { getCollections, getSite } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

export async function GET() {
  const [site, collections] = await Promise.all([getSite(), getCollections()]);
  const base = siteUrl();

  const lines = [
    `# ${site.name}`,
    "",
    `> ${site.seo.defaultDescription || site.about || site.tagline}`,
    "",
    `${site.name} is an online fashion store based in Pakistan, specializing in premium unstitched suits and fabrics.`,
    "",
    "## Product Categories",
    "",
    ...collections.map((c) => `- [${c.title}](${base}/collections/${c.slug}): ${c.description || `${c.productCount} products`}`),
    `- [All Products](${base}/collections/all): Browse the complete catalog`,
    "",
    "## Key Pages",
    "",
    `- [Home](${base}/)`,
    `- [All Collections](${base}/collections/all)`,
    `- [Contact Us](${base}/pages/contact-us)`,
    `- [Sitemap](${base}/sitemap.xml)`,
    "",
    "## Contact",
    "",
    ...[
      site.email ? `- Email: ${site.email}` : null,
      site.phone ? `- Phone: ${site.phone}` : null,
      site.whatsapp ? `- WhatsApp: ${site.whatsapp}` : null,
      site.address ? `- Address: ${site.address}` : null,
    ].filter(Boolean) as string[],
    "",
    "## Social",
    "",
    ...site.social.map((s) => `- [${s.label}](${s.href})`),
    "",
    "## Currency & Shipping",
    "",
    "- Currency: PKR (Pakistani Rupee)",
    ...(site.freeShippingThreshold ? [`- Free shipping on orders above PKR ${site.freeShippingThreshold.toLocaleString()}`] : []),
    ...site.shippingMethods.map((m) => `- ${m.name}: ${m.fee > 0 ? `PKR ${m.fee}` : "Free"}`),
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400, s-maxage=86400" },
  });
}
