# 代码规范指南

> 抖店项目代码规范总入口，包含所有模块的规范文件索引。

---

## 规范文件索引

### 通用规范（所有代码）

| 文件 | 内容 |
|------|------|
| [general/README.md](./general/README.md) | 通用规范目录 |
| [general/typescript.md](./general/typescript.md) | TypeScript 配置 |
| [general/naming.md](./general/naming.md) | 命名规范 |
| [general/imports.md](./general/imports.md) | 导入规范 |
| [general/comments.md](./general/comments.md) | 注释规范 |
| [general/commits.md](./general/commits.md) | 提交规范 |

### 脚本规范（`src/features/`, `src/utils/`）

| 文件 | 内容 |
|------|------|
| [script/README.md](./script/README.md) | 脚本规范目录 |
| [script/feature-module.md](./script/feature-module.md) | FeatureModule 结构 |
| [script/logging.md](./script/logging.md) | 日志规范 |
| [script/async-error.md](./script/async-error.md) | 异步与错误处理 |
| [script/selectors.md](./script/selectors.md) | Playwright 选择器 |
| [script/config.md](./script/config.md) | 环境变量配置 |
| [script/browser.md](./script/browser.md) | 浏览器启动 |
| [script/session.md](./script/session.md) | 登录态检查 |

### 后端规范（`src/server/`）

| 文件 | 内容 |
|------|------|
| [backend/README.md](./backend/README.md) | 后端规范目录 |
| [backend/api-response.md](./backend/api-response.md) | API 响应格式 |
| [backend/types.md](./backend/types.md) | 类型定义 |
| [backend/routes.md](./backend/routes.md) | 路由定义 |
| [backend/process.md](./backend/process.md) | 进程管理 |
| [backend/sse.md](./backend/sse.md) | Server-Sent Events |
| [backend/static-spa.md](./backend/static-spa.md) | 静态资源与 SPA 回退 |

### 前端规范（`web/src/`）

| 文件 | 内容 |
|------|------|
| [frontend/README.md](./frontend/README.md) | 前端规范目录 |
| [frontend/react-components.md](./frontend/react-components.md) | React 组件 |
| [frontend/imports.md](./frontend/imports.md) | 导入顺序 |
| [frontend/tailwind-css.md](./frontend/tailwind-css.md) | Tailwind CSS |
| [frontend/ui-components.md](./frontend/ui-components.md) | UI 组件 |
| [frontend/state.md](./frontend/state.md) | 状态管理 |
| [frontend/api-client.md](./frontend/api-client.md) | API 客户端 |
| [frontend/routing.md](./frontend/routing.md) | 路由 |
| [frontend/layout.md](./frontend/layout.md) | 布局组件 |

### 测试规范（`tests/`）

| 文件 | 内容 |
|------|------|
| [test/README.md](./test/README.md) | 测试规范目录 |
| [test/naming.md](./test/naming.md) | 文件命名 |
| [test/structure.md](./test/structure.md) | 测试结构 |
| [test/environment.md](./test/environment.md) | 环境变量控制 |
| [test/assertions.md](./test/assertions.md) | 断言规范 |
| [test/import.md](./test/import.md) | 导入规范 |
| [test/config.md](./test/config.md) | Playwright 配置 |
| [test/tags.md](./test/tags.md) | 测试标签 |

### 其他规范

| 文件 | 内容 | 适用范围 |
|------|------|----------|
| `.cursor/rules/local-mcp-validation.mdc` | MCP 浏览器验证流程 | 浏览器自动化 |
| `harness/README.md` | Agent hooks | Hook 开发 |
| `CODING_STANDARDS.md` | 完整规范（合订版） | 所有代码 |

---

## 快速参考

### 新增功能模块
```typescript
// 详见：script/feature-module.md
src/features/<slug>/index.ts → 导出 { id, displayName, run }
```

### 新增 API 端点
```typescript
// 详见：backend/api-response.md
src/server/main.ts → 返回 { ok: true, ... } 或 { ok: false, error }
```

### 新增前端组件
```typescript
// 详见：frontend/react-components.md, frontend/tailwind-css.md
web/src/components/ → 函数组件 + @/ 别名导入 + Tailwind 类名顺序
```

### 新增测试
```typescript
// 详见：test/naming.md, test/structure.md、tests/README.md
tests/mcp/scripts/verify-offline.ts（离线契约）；Feature 真网步骤放 tests/mcp/features/*.md（AI + MCP）；**用户向流程说明**放 src/features/<目录>/README.md（与 MCP 文档均由 npm run sync:feature-docs / hook 刷新 AUTO）；共享步骤放 tests/actions/，纯数据放 tests/pure/
```

---

## 代码审查清单

提交前确保：
- [ ] 已阅读对应模块的代码规范
- [ ] `npm run build` 通过
- [ ] 新功能有对应测试
- [ ] 敏感信息未提交（`.env`、`storage-state.json`）
- [ ] 日志包含 `[feature-id]` 前缀（脚本代码）
- [ ] Playwright 选择器已验证（必要时使用 `npm run codegen`）

---

## 相关文档

- [项目主 README](../README.md) - 架构概览、CLI 使用
- [Web 前端 README](../web/README.md) - 前端架构、路由、组件库
- [Harness 文档](../harness/README.md) - Agent hooks、收尾流程
