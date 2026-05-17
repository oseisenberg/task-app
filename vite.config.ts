import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative base so the built assets load no matter what path/prefix the
  // app is served from (preview hosts, sub-paths) — absolute "/assets/…"
  // 404s under any non-root mount and shows a blank white screen.
  base: "./",
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
  },
});
