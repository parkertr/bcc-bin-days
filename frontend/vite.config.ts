import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/bins": "http://localhost:8080",
      "/suburbs": "http://localhost:8080",
      "/streets": "http://localhost:8080",
      "/health": "http://localhost:8080",
    },
  },
});
