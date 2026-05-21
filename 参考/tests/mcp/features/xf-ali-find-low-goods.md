# Feature：`xf-ali-find-low-goods`（晓风上货·低价好物筛选（1.1））

> 本文档面向：**新手读懂用途** + **AI 按 MCP 做实测**。上方摘要随源码自动更新；下方「手册区」可人工润色。

<!-- AUTO:FEATURE_DOC -->
> **本区块由仓库 hook / `node harness/lib/sync-feature-mcp-docs.mjs` 根据源码自动生成**，请勿手工编辑；要写补充说明请改下方「手册区」。

## 同步摘要（机读）

- **id**：`xf-ali-find-low-goods`
- **名称**：晓风上货·低价好物筛选（1.1）
- **源码目录**：`src/features/xf-ali-find-low-goods/`
- **相关文件**：src/features/xf-ali-find-low-goods/index.ts、src/features/xf-ali-find-low-goods/ui-pipeline.ts

### 源码顶部说明（摘录）

```text
晓风 · 低价好物筛选（AGENT_TODOLIST 1.1）

环境变量：
- XF_SUPER_GOODS_URL — 低价好物页（默认 zzbtool hash 路由）
- 默认先打开抖店工作台首页（/ffa/mshop/homepage/index，与 dashboard 一致），再跳转晓风或走服务市场
- XF_SKIP_DOUDIAN_HOME=1 — 跳过上述抖店首页，直达服务市场或 XF_SUPER_GOODS_URL（旧行为）
- XF_NAV_VIA_DOUYIN=1 — 先从抖店进服务市场（如 fuwu.jinritemai.com），再点击右侧「常用服务」或「已购服务」里的「晓风上货-商品管理管家/专家」等入口（勿只靠直达 URL，否则登录态可能不对）
- XF_SERVICE_MARKET_URL — 服务市场完整 URL（与 XF_NAV_VIA_DOUYIN 联用，须自行从后台复制稳定链接）
- XF_SERVICE_MARKET_PATH — 相对 DOUDIAN_BASE_URL 的路径（XF_SERVICE_MARKET_URL 未设时使用）
- STORAGE_STATE_PATH — 见 appConfig；晓风/zztool 与抖店不同域时需在同一 save-session 流程里登录或单独 JSON
- XF_SKIP_FAIL_ARTIFACTS=1 — 关闭失败时自动 dump（默认开启：整页截图 PNG + HTML + Playwright trace）

失败时写入 `xf-fail-*.{png,html}` 与 `*.trace.zip`（Web 任务优先写入 `DOUDIAN_UI_ARTIFACT_DIR`，否则 `.data/xf-artifacts/`；可用 `npx playwright show-trace <zip路径>` 查看）。

开发时用 PLAYWRIGHT_HEADED=1 + npm run codegen -- <url> 校准选择器；亦可用 Cursor 浏览器 MCP 对照快照（见 .cursor/rules/local-mcp-validation.mdc）。
```

### 文中出现的 URL（自动抓取，便于 MCP 对照）

- https://xfdyorder.zzbtool.com/zzb_super_goods_xf/index.html#/home/aliFindLowGoods

### 涉及的 `process.env.*`（自动抓取）

`DOUDIAN_UI_ARTIFACT_DIR`、`XF_PICK_COUNT`、`XF_SERVICE_MARKET_PATH`、`XF_SERVICE_MARKET_URL`、`XF_SUPER_GOODS_URL`

### CLI 快速对照

```bash
npm run dev -- --feature=xf-ali-find-low-goods
```

### 契约与离线校验

- 结构化契约：**`tests/mcp/contracts/xf-low-goods-mcp-contract.ts`**
- 注册表条目：**`tests/mcp/contracts/features-mcp-registry.ts`**
- 离线：`npm run test`（内含 `verify-offline.ts`，非浏览器）

### MCP 推荐顺序（给 AI 的步骤骨架）

1. **工作台**：带 `storageState` 打开 `https://fxg.jinritemai.com/ffa/mshop/homepage/index`（或当前 `DOUDIAN_BASE_URL` 同路径），确认标题/URL 不像登录墙。
2. **服务市场**：打开契约中的 `fuwuPathExample` 或 env 配置的 URL → 静置约 `sidecarWaitMsHint` ms → 用 locator 计数对照 **`xfLowGoodsMcpContract.postFuwuDomExpectations`**。
3. **深入晓风**：涉及 iframe/侧栏点击策略，务必对照源码注释 **`clickStrategyNote`** 与契约字段。

### MCP 实录要求

- 结论写入 **`.data/mcp-session-records/`**，模板 **`docs/script/mcp-session-record.md`**。
- Playwright MCP 工具名以 Cursor 启用 **`user-playwright`** 为准（如 `browser_navigate` / `browser_snapshot` / `browser_run_code_unsafe`）。

<!-- END:AUTO:FEATURE_DOC -->

<!-- MANUAL:FEATURE_DOC -->

## 给新手看的（白话）

这是 **「晓风 · 低价好物」** 一类自动化：步骤长，可能在抖店后台、服务市场、第三方晓风页面之间跳转。  
新手只要记住：**登录态要完整**，而且「从抖店进服务市场再点晓风」有时比「直接敲晓风网址」更稳（源码里用环境变量控制）。

## 给 AI 写 MCP 测试时的要点

- **契约**：精读 **`tests/mcp/contracts/xf-low-goods-mcp-contract.ts`**（DOM 计数下限、标题关键字、featureId 与 `ui-pipeline.ts` 一致）。
- **离线校验**：`npm run test` 中的 `verify-offline.ts` 会检查上述契约与注册表；**不等于**真网通过。
- MCP 建议步骤：先 **带 storage 打开抖店工作台** → 再按契约走 **服务市场**（示例 URL 见契约 / 源码 env）。
- 环境变量多（`XF_NAV_VIA_DOUYIN`、`XF_SERVICE_MARKET_URL` 等），改脚本后用 hook 刷新文档上半部的「源码摘要」。
- CLI 对照：`npm run xf:low-goods`（具体 env 见源码文件头注释）。

<!-- END:MANUAL:FEATURE_DOC -->
