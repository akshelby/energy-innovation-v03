import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Improve hosted load time: keep large vendor libs in single, cacheable chunks
    // and prevent Vite from emitting one tiny file per lucide-react icon (which
    // caused 30+ serial script requests on the hosted site).
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("lucide-react")) return "icons";
            if (id.includes("react-router")) return "react-vendor";
            if (id.includes("react-dom") || id.match(/[\\/]react[\\/]/)) return "react-vendor";
            if (id.includes("@supabase")) return "supabase";
            if (id.includes("@radix-ui")) return "ui-radix";
            if (id.includes("@tanstack")) return "query";
            if (id.includes("framer-motion")) return "motion";
            if (id.includes("embla-carousel")) return "embla";
            return "vendor";
          }
        },
      },
    },
  },
}));
