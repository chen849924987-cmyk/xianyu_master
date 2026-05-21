# 测试导入规范

## 标准导入

```typescript
// 1. Playwright 测试
import { expect, test } from "@playwright/test";

// 2. Node.js 内置
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// 3. 项目编译后代码（推荐 tests/support/repo-root.ts 的 resolveRepoRoot(import.meta.url)，避免手写 `../..` 因目录深度出错）
import { resolveRepoRoot } from "../../../support/repo-root.js"; // 相对路径按用例文件位置调整

const repoRoot = resolveRepoRoot(import.meta.url);

const pwdHref = pathToFileURL(
  path.join(repoRoot, "dist/utils/doudian-password-login.js")
).href;

const pwdMod = await import(pwdHref);
```

## 导入编译后代码

测试使用编译后的 `dist/` 目录代码：

```typescript
// ✅ 正确：导入 dist/ 编译后的代码
const pwdHref = pathToFileURL(
  path.join(repoRoot, "dist/utils/doudian-password-login.js")
).href;

const cfgHref = pathToFileURL(
  path.join(repoRoot, "dist/utils/config.js")
).href;

const pwdMod = await import(pwdHref);
const cfgMod = await import(cfgHref);

// ❌ 错误：直接导入 src/ 源文件
import { performPasswordLogin } from "../src/utils/doudian-password-login.ts";
```

## 批量导入

```typescript
// 多个模块导入
const [pwdMod, cfgMod, browserMod] = await Promise.all([
  import(pathToFileURL(path.join(repoRoot, "dist/utils/doudian-password-login.js")).href),
  import(pathToFileURL(path.join(repoRoot, "dist/utils/config.js")).href),
  import(pathToFileURL(path.join(repoRoot, "dist/utils/browser.js")).href),
]);
```

## 类型导入

```typescript
// 编译后代码可能无类型，使用 any 或自定义类型
type PasswordLoginModule = {
  isPasswordLoginConfigured(): boolean;
  performPasswordLogin(page: Page, baseUrl: string): Promise<void>;
};

const pwdMod = (await import(pwdHref)) as PasswordLoginModule;
```

## 构建依赖

```bash
# 运行测试前必须先构建
npm run build

# 或使用 package.json 脚本
npm run test        # 自动执行 build + tests/mcp/scripts/verify-offline.ts
```
