import type { ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const dir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(dir, "..");

/** 3847 未启动时避免把 /api 落到 SPA 的 index.html（否则会 JSON.parse 崩） */
function apiProxyOnError(res: ServerResponse | undefined) {
  if (!res || typeof res.writeHead !== "function" || res.headersSent) return;
  res.writeHead(503, { "Content-Type": "application/json; charset=utf-8" });
  res.end(
    JSON.stringify({
      ok: false,
      error:
        "API 未监听 127.0.0.1:3847。请在仓库根目录执行 npm run ui:server，或使用 npm run ui:dev 同时启动前后端。",
    }),
  );
}

export default defineConfig({
  root: dir,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.join(dir, "src"),
      "@repo": repoRoot,
    },
  },
  server: {
    fs: {
      allow: [dir, repoRoot],
    },
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3847",
        changeOrigin: true,
        configure(proxy) {
          proxy.on("error", (_err, _req, res) => {
            apiProxyOnError(res as ServerResponse | undefined);
          });
        },
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
