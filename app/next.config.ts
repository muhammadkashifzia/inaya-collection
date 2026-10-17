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
