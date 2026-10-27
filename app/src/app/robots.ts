import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

const PRIVATE_PATHS = ["/account", "/cart", "/checkout", "/wishlist", "/search", "/offline", "/api"];

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      // Default rule for all bots
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      // Explicitly allow AI search/citation bots (so CDN/WAF whitelisting is clear)
      { userAgent: "GPTBot", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "ChatGPT-User", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "ClaudeBot", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "Claude-SearchBot", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "Claude-User", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "PerplexityBot", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "Perplexity-User", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "Googlebot", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "Google-Extended", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "Bingbot", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "Applebot", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "Applebot-Extended", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "xAI-Bot", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "DuckAssistBot", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "Amazonbot", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "YouBot", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "facebookexternalhit", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: "meta-externalagent", allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
