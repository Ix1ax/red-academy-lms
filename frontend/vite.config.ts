import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Gateway the dev server forwards /api and /ws to. Mirrors the prod Caddy setup
// (same-origin), so the app works with an empty VITE_API_URL in development —
// including the SockJS/STOMP websocket used for realtime notifications.
const gateway = process.env.GATEWAY_URL ?? "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: gateway,
        changeOrigin: true
      },
      "/ws": {
        target: gateway,
        changeOrigin: true,
        ws: true
      }
    }
  }
});
