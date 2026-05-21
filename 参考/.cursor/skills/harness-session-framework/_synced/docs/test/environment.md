# 环境变量控制规范

抖店 **Feature 真网**不在 `npm test` 里门禁开关；由 Cursor AI 按 **`tests/mcp/features/*.md`** + Playwright MCP 执行，实录见 **`docs/script/mcp-session-record.md`**。

下文示例中的 **`FEATURE_FLAG`** 仅为「如何用 env 控制跳过」的写法模板。

## 检查模式

```typescript
// 简单检查
const isEnabled = process.env.FEATURE_FLAG === "1";

// 多值检查（大小写不敏感）
const isEnabled = ["1", "true", "yes", "on"].includes(
  process.env.FEATURE_FLAG?.trim().toLowerCase() ?? ""
);

// 组合条件（示例：密码登录 CLI）
const canRunPasswordLogin =
  process.env.DOUDIAN_PASSWORD_LOGIN === "1" &&
  Boolean(process.env.DOUDIAN_LOGIN_EMAIL) &&
  Boolean(process.env.DOUDIAN_LOGIN_PASSWORD);
```

## 测试跳过

```typescript
// 简单跳过
test.skip(process.env.FEATURE_FLAG !== "1", "Set FEATURE_FLAG=1 to run");

// 复杂条件
test.skip(
  process.env.FEATURE_FLAG !== "1" ||
    !["1", "true", "yes", "on"].includes(
      process.env.FEATURE_FLAG?.trim().toLowerCase() ?? ""
    ),
  "Set FEATURE_FLAG=1"
);
```

## 断言配置状态

```typescript
// 在测试中验证配置
expect(
  pwdMod.isPasswordLoginConfigured(),
  "needs DOUDIAN_PASSWORD_LOGIN=1 and DOUDIAN_LOGIN_EMAIL / DOUDIAN_LOGIN_PASSWORD"
).toBe(true);

// 断言环境变量
expect(process.env.DOUDIAN_BASE_URL).toBeTruthy();
```

## 常用环境变量

| 变量 | 用途 |
|------|------|
| `DOUDIAN_PASSWORD_LOGIN` | 启用密码登录（CLI `login` feature） |
| `DOUDIAN_LOGIN_EMAIL` | 登录邮箱 |
| `DOUDIAN_LOGIN_PASSWORD` | 登录密码 |
| `DOUDIAN_BASE_URL` | 测试目标 URL |
| `STORAGE_STATE_PATH` | 登录态文件路径 |

## 条件性逻辑

```typescript
test("password login helper example", async ({ context }) => {
  await performPasswordLogin(page, baseUrl);

  if (process.env.DOUDIAN_SAVE_SESSION_AFTER_LOGIN === "1") {
    await saveStorageState(context);
    // eslint-disable-next-line no-console
    console.log("[login] saved storage state");
  } else {
    // eslint-disable-next-line no-console
    console.log("[login] set DOUDIAN_SAVE_SESSION_AFTER_LOGIN=1 to persist");
  }
});
```
