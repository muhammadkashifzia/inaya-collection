import type { NextConfig } from "next";

const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000");
const isLocalApi = ["localhost", "127.0.0.1", "::1"].includes(apiUrl.hostname);

const nextConfig: NextConfig = {
  // Self-contained server (.next/standalone/server.js) for cPanel Passenger deploys.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    qualities: [75],
    // Product, category and banner images are served by the Laravel API from /storage.
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: "/storage/**",
      },
    ],
    // Only needed when the API runs on localhost during development.
    dangerouslyAllowLocalIP: isLocalApi && process.env.NODE_ENV !== "production",
  },
  async headers() {
    return [
      {
        // Always fetch the latest service worker so updates roll out immediately.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        // Immutable hashed static assets — cache forever.
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Font files — long cache.
        source: "/_next/static/media/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Public images — cache for 1 week, allow revalidation.
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
