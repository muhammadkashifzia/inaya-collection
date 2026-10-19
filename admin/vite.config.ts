import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  build: {
    // Enable CSS code splitting for smaller initial CSS
    cssCodeSplit: true,
    // Target modern browsers for smaller bundles
    target: "es2020",
    // Increase chunk size warning limit (vendor chunks will be large)
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      onwarn(warning, warn) {
        // Skip eval warnings from react-jvectormap
        if (
          warning.code === "EVAL" &&
          warning.id?.includes("@react-jvectormap")
        ) {
          return;
        }
        warn(warning);
      },
      output: {
        // Manual chunk splitting for better caching
        manualChunks(id) {
          // Core React runtime — changes rarely
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) {
            return "react-vendor";
          }
          // Router — separate from React core
          if (id.includes("node_modules/react-router")) {
            return "router";
          }
          // Charts — heavy and only used on dashboard/chart pages
          if (id.includes("node_modules/apexcharts") || id.includes("node_modules/react-apexcharts")) {
            return "charts";
          }
          // Calendar — heavy, only used on calendar page
          if (id.includes("node_modules/@fullcalendar")) {
            return "calendar";
          }
          // Maps — heavy, only used on map pages
          if (id.includes("node_modules/leaflet") || id.includes("node_modules/maplibre-gl") || id.includes("node_modules/react-map-gl") || id.includes("node_modules/jsvectormap")) {
            return "maps";
          }
          // Swiper — carousel, separate chunk
          if (id.includes("node_modules/swiper")) {
            return "swiper";
          }
          // i18n — internationalization runtime
          if (id.includes("node_modules/i18next") || id.includes("node_modules/react-i18next")) {
            return "i18n";
          }
          // DnD — drag and drop
          if (id.includes("node_modules/react-dnd")) {
            return "dnd";
          }
          // Everything else from node_modules → single vendor chunk
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
});
