import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { apiPlugin } from "./app/server/vite-plugin";

// Ứng dụng chạy hoàn toàn trên máy (local-first): Vite phục vụ giao diện,
// API đọc/ghi trực tiếp các file trong repo này.
export default defineConfig({
  root: "app/web",
  plugins: [react(), apiPlugin()],
  server: { host: "127.0.0.1", port: 5173 },
  build: { outDir: "../../dist", emptyOutDir: true },
  test: { root: ".", include: ["app/tests/**/*.test.ts"] },
} as never);
