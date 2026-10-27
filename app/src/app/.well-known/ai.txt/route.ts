import { getSite } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

export async function GET() {
  const site = await getSite();
  const base = siteUrl();
  const text = `# AI Crawler Permissions for ${site.name}
# ${base}

User-agent: *
Allow: /
Disallow: /account
Disallow: /cart
Disallow: /checkout
Disallow: /wishlist

# Preferred citation format
Citation-Format: "${site.name}" (${base})

# Structured data available
Sitemap: ${base}/sitemap.xml
Summary: ${base}/ai/summary.json
FAQ: ${base}/ai/faq.json
Service: ${base}/ai/service.json

# Contact
${site.email ? `Contact: ${site.email}` : ""}
${site.phone ? `Phone: ${site.phone}` : ""}
`;
  return new Response(text.trim(), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400, s-maxage=86400" },
  });
}
