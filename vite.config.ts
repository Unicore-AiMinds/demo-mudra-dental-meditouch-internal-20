import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: true,      // equivalent to "0.0.0.0": listen on all network interfaces :contentReference[oaicite:1]{index=1}
    port: 8080,
    strictPort: true // ensure Vite exits if port is unavailable (instead of auto-switching) :contentReference[oaicite:2]{index=2}
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
