import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Les appels /api/... sont relayés vers l'API Spring Boot (port 9080).
// Pour le navigateur, tout vient de http://localhost:3000 : aucun CORS à configurer.
const proxy = {
  "/api": {
    target: process.env.API_TARGET || "http://localhost:9080",
    changeOrigin: false,
  },
};

export default defineConfig({
  plugins: [react()],
  server: { port: 3000, strictPort: true, proxy },
  preview: { port: 3000, strictPort: true, proxy },
});
