# 代码提交规范

## 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

## 类型（type）

| 类型 | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 bug |
| `refactor` | 重构（不改变行为） |
| `docs` | 仅文档更改 |
| `style` | 格式调整（不影响代码逻辑） |
| `test` | 测试相关 |
| `chore` | 构建/工具/依赖更新 |
| `perf` | 性能优化 |

## 范围（scope）

- `login` - 登录模块
- `features` - 功能模块
- `api` - 后端 API
- `ui` - 前端界面
- `test` - 测试
- `harness` - Cursor hooks
- `deps` - 依赖

## 示例

```
feat(login): 添加密码自动登录功能

- 支持邮箱+密码自动填充
- 滑块验证码人工处理流程
- 登录成功后自动保存 storage-state

BREAKING CHANGE: 环境变量 DOUDIAN_PASSWORD_LOGIN 需手动开启
```

```
fix(api): 修复 SSE 连接断开时未清理资源的问题

在客户端断开连接时，从 job.sse Set 中移除 Response 对象，
避免内存泄漏和后续的写入错误。
```

```
refactor(utils): 提取通用的登录态校验逻辑

将工作台登录态检查从 login feature 移至 doudian-session.ts，
供其他 feature 复用。
```

```
docs: 更新 README 中的 CLI 使用说明

添加关于 --save-session 和 --feature 的详细示例。
```

## 代码审查清单

提交前自检：
- [ ] `npm run build` 通过（无 TypeScript 错误）
- [ ] 新功能添加对应测试
- [ ] 敏感信息未提交（检查 `.env`, `storage-state.json`）
- [ ] 日志包含 `[feature-id]` 前缀
- [ ] Playwright 选择器已验证（必要时使用 `npm run codegen`）
- [ ] 提交信息符合规范格式
- [ ] 相关文档已更新
