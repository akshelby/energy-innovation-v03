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
          if (!id.includes("node_modules")) return;
          // Split major vendor groups so the browser can download them in
          // parallel instead of one giant main bundle. React + Router stay
          // together to avoid TDZ / circular-init issues across chunks.
          if (id.includes("lucide-react")) return "icons";
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("react-router") ||
            id.includes("scheduler")
          ) return "react-vendor";
          if (id.includes("@supabase")) return "supabase-vendor";
          if (id.includes("@tanstack")) return "query-vendor";
          if (id.includes("framer-motion")) return "motion-vendor";
          if (
            id.includes("@radix-ui") ||
            id.includes("/cmdk/") ||
            id.includes("/vaul/") ||
            id.includes("/sonner/")
          ) return "ui-vendor";
        },
      },
    },
  },
}));
