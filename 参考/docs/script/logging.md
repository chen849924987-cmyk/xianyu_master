# 日志规范

## 日志工具

统一使用 `src/utils/logger.ts`：

```typescript
import { log } from "../../utils/index.js";
```

## 日志格式

```typescript
// 所有日志以 [feature-id] 前缀开头
log.info("[login] 打开门户首页:", landingUrl);
log.info("[login] 工作台 HTTP", httpStatus, "URL:", finalUrl);
log.warn("[session] 未找到登录态文件");
log.error("[login] 登录失败:", error.message);
```

## 关键规则

1. **[feature-id] 前缀** - 与模块 id 一致
2. **敏感信息不打印** - 密码、Token、Cookie 值
3. **逗号分隔** - 对象使用逗号而非字符串拼接
4. **关键步骤打日志** - 便于追踪执行流程

```typescript
// ✅ 好的日志
log.info("[login] 打开门户首页:", landingUrl);
log.info("[login] 密码登录配置状态:", isConfigured);

// ❌ 避免的日志
log.info("[login] 密码是: " + password);  // 敏感信息！
log.info("[login] 打开门户首页: " + landingUrl);  // 字符串拼接
console.log("打开门户首页");  // 不使用 log 工具，无前缀
```

## 日志级别使用

| 级别 | 用途 |
|------|------|
| `info` | 正常流程步骤 |
| `warn` | 非致命问题，可继续执行 |
| `error` | 错误，通常需中断 |
| `debug` | 详细调试信息（开发时使用） |

## 日志示例

```typescript
export const loginFeature: FeatureModule = {
  id: "login",
  displayName: "登录",
  async run({ page, baseUrl }) {
    log.info("[login] 开始登录流程");
    
    const landing = `${baseUrl}/`;
    log.info("[login] 打开门户首页:", landing);
    await page.goto(landing);
    
    if (isPasswordLoginConfigured()) {
      log.info("[login] 使用密码登录流程");
      await performPasswordLogin(page, baseUrl);
    } else {
      log.info("[login] 依赖已有 storageState");
    }
    
    try {
      const result = await openWorkbenchAndAssertLoggedIn(page, baseUrl);
      log.info("[login] 登录成功，状态:", result.httpStatus);
    } catch (e) {
      log.error("[login] 登录态校验失败:", e);
      throw e;
    }
    
    log.info("[login] 完成");
  },
};
```
