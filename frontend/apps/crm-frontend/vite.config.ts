import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3010,
    fs: {
      allow: [
        // Allow serving files from the project root
        path.resolve(__dirname, "../../../"),
        // Allow serving files from the frontend directory
        path.resolve(__dirname, "../../"),
        // Allow serving files from current directory
        path.resolve(__dirname, "./"),
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
