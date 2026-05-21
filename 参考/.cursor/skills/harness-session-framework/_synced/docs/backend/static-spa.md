# 静态资源与 SPA 回退规范

## 静态资源服务

```typescript
const webDist = path.join(repoRoot, "web", "dist");
const webIndex = path.join(webDist, "index.html");

if (fs.existsSync(webDist) && fs.existsSync(webIndex)) {
  // 静态资源
  app.use(express.static(webDist, {
    maxAge: "1d",  // 缓存控制
    etag: true,
  }));
  
  // SPA 回退（必须在 API 路由之后）
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();  // API 路由不处理
      return;
    }
    
    // 避免缓存 HTML
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(webIndex);
  });
}
```

## 顺序要求

```typescript
// 1. API 路由先注册
app.get("/api/features", handler);
app.post("/api/jobs/run", handler);

// 2. 静态资源中间件
app.use(express.static(webDist));

// 3. SPA 回退（最后，捕获所有非 /api 请求）
app.get("*", spaFallbackHandler);
```

## 开发模式

开发时使用 Vite 代理而非 Express 静态资源：

```bash
# 同时启动 API 和 Vite
npm run ui:dev

# 仅 API
npm run ui:server
```

Vite 配置（`web/vite.config.ts`）：

```typescript
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3847",
        changeOrigin: true,
      },
    },
  },
});
```
