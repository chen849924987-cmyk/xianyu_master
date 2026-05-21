# 环境变量配置规范

## 统一配置入口

所有环境变量在 `src/utils/config.ts` 管理：

```typescript
import path from "node:path";

const repoRoot = process.cwd();

export const appConfig = {
  /** 抖店后台 base URL */
  get baseUrl() {
    return process.env.DOUDIAN_BASE_URL ?? "https://fxg.jinritemai.com";
  },
  
  /** 登录态文件路径 */
  get storageStatePath() {
    return process.env.STORAGE_STATE_PATH ?? path.join(repoRoot, ".data", "storage-state.json");
  },
  
  /** 是否 headed 模式 */
  get headed() {
    return process.env.PLAYWRIGHT_HEADED === "1";
  },
  
  /** 密码登录后是否保存 session */
  get saveSessionAfterPasswordLogin() {
    return process.env.DOUDIAN_SAVE_SESSION_AFTER_LOGIN === "1";
  },
  
  /** 飞鸽 base URL */
  get imBaseUrl() {
    return process.env.DOUDIAN_IM_BASE_URL ?? "https://im.jinritemai.com";
  },
};
```

## 配置检查函数

```typescript
export function isPasswordLoginConfigured(): boolean {
  return (
    process.env.DOUDIAN_PASSWORD_LOGIN === "1" &&
    Boolean(process.env.DOUDIAN_LOGIN_EMAIL) &&
    Boolean(process.env.DOUDIAN_LOGIN_PASSWORD)
  );
}

export function isCaptchaProviderConfigured(): boolean {
  return process.env.DOUDIAN_CAPTCHA_PROVIDER === "twocaptcha";
}
```

## 使用示例

```typescript
import { appConfig, isPasswordLoginConfigured } from "../../utils/index.js";

export const loginFeature: FeatureModule = {
  id: "login",
  displayName: "登录",
  async run({ page, baseUrl, browserContext }) {
    // 使用配置
    const targetUrl = baseUrl || appConfig.baseUrl;
    
    // 检查配置
    if (isPasswordLoginConfigured()) {
      // 执行密码登录
    }
    
    // 保存登录态
    if (appConfig.saveSessionAfterPasswordLogin && browserContext) {
      await saveStorageState(browserContext);
    }
  },
};
```

## 环境变量文档

新增环境变量需在 `.env.example` 添加注释：

```bash
# .env.example

# 抖店后台入口地址
DOUDIAN_BASE_URL=https://fxg.jinritemai.com

# 飞鸽工作台地址
DOUDIAN_IM_BASE_URL=https://im.jinritemai.com

# 登录态文件路径（默认 .data/storage-state.json）
STORAGE_STATE_PATH=

# Playwright 可视化模式（1=启用，0=headless）
PLAYWRIGHT_HEADED=0

# 密码自动登录（需同时配置邮箱密码）
DOUDIAN_PASSWORD_LOGIN=0
DOUDIAN_LOGIN_EMAIL=
DOUDIAN_LOGIN_PASSWORD=

# 密码登录后自动保存 session
DOUDIAN_SAVE_SESSION_AFTER_LOGIN=0
```
