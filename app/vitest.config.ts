/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Stub out Next.js and server-only modules for testing
      "server-only": path.resolve(__dirname, "src/__tests__/mocks/server-only.ts"),
      "next/image": path.resolve(__dirname, "src/__tests__/mocks/next-image.tsx"),
      "next/link": path.resolve(__dirname, "src/__tests__/mocks/next-link.tsx"),
      "next/navigation": path.resolve(__dirname, "src/__tests__/mocks/next-navigation.ts"),
      "next/cache": path.resolve(__dirname, "src/__tests__/mocks/next-cache.ts"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.tsx"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
});
