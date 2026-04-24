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
          // Only split lucide-react into its own chunk to prevent the
          // 30+ icon waterfall on the hosted site. Keep everything else
          // in Rollup's default vendor chunking to avoid circular-
          // dependency / temporal-dead-zone errors that arise when React,
          // React-DOM, Router and other tightly coupled libs are split
          // across separate chunks.
          if (id.includes("node_modules") && id.includes("lucide-react")) {
            return "icons";
          }
        },
      },
    },
  },
}));
