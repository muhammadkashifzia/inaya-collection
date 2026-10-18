import type { MetadataRoute } from "next";
import { getSite } from "@/lib/data";

const FALLBACK_NAME = "Anaya Collection";

/** Web app manifest (served at /manifest.webmanifest) so the store can be installed as a PWA. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let name = FALLBACK_NAME;
  let description: string | undefined;
  try {
    const site = await getSite();
    name = site.name || FALLBACK_NAME;
    description = site.seo.defaultDescription || site.about || undefined;
  } catch {
    // API unavailable: keep the static fallback so the app stays installable.
  }

  return {
    id: "/",
    name,
    short_name: name.length > 12 ? name.split(" ")[0] : name,
    description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0b1d36",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Search", url: "/search", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Cart", url: "/cart", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "My orders", url: "/account/orders", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
