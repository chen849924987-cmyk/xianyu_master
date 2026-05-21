# 晓风上货·低价好物筛选（1.1）（`xf-ali-find-low-goods`）

> 本页说明：**这个 Feature 是干什么的**、**代码大致按什么顺序执行**。技术细节以 `.ts` 源码为准。

<!-- AUTO:FEATURE_FOLDER_README -->
> **本区块由 `node harness/lib/sync-feature-folder-readme.mjs`（或 Cursor `afterFileEdit` hook）根据源码自动生成**，请勿手工编辑；要写给用户看的流程说明请改下方「白话流程」区块。

## 源码索引（自动）

- **Feature id**：`xf-ali-find-low-goods`
- **列表上的名字**：晓风上货·低价好物筛选（1.1）
- **本目录 TypeScript 文件**：`src/features/xf-ali-find-low-goods/index.ts`、`src/features/xf-ali-find-low-goods/ui-pipeline.ts`

### 命令行怎么跑

```bash
npm run dev -- --feature=xf-ali-find-low-goods
```

### 其它文档

- **给 AI / MCP 实测的步骤清单**：[`tests/mcp/features/xf-ali-find-low-goods.md`](../../../tests/mcp/features/xf-ali-find-low-goods.md)（相对路径从本 README 出发指向仓库内文件）
- **注册表条目**：`tests/mcp/contracts/features-mcp-registry.ts`

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

### 代码里出现的网址（自动列出）

- https://xfdyorder.zzbtool.com/zzb_super_goods_xf/index.html#/home/aliFindLowGoods

### 代码里读过的环境变量名（自动列出）

`DOUDIAN_UI_ARTIFACT_DIR`、`XF_PICK_COUNT`、`XF_SERVICE_MARKET_PATH`、`XF_SERVICE_MARKET_URL`、`XF_SUPER_GOODS_URL`

### 契约（对齐 MCP / 离线校验）

- `tests/mcp/contracts/xf-low-goods-mcp-contract.ts`

<!-- END:AUTO:FEATURE_FOLDER_README -->

<!-- MANUAL:FEATURE_FOLDER_README -->

## 这个 Feature 在干什么？

自动化「**晓风 · 低价好物**」相关页面流程：往往要先在抖店侧「热身」，再进服务市场点晓风入口，最后在第三方页或 iframe 里继续操作。步骤多、依赖登录态与 DOM，失败时会自动留截图/trace 方便排查。

## 代码大致怎么走？（按阶段理解即可）

1. **读环境变量**：决定是否跳过抖店首页、是否走「抖店 → 服务市场 → 点晓风」、服务市场 URL、低价好物直达链接等（详见 **`index.ts` 文件头注释**）。
2. **可选 tracing / 失败落盘**：失败时截屏、HTML、trace zip（Web 任务可与控制台产物目录统一）。
3. **落地抖店工作台（默认）**：先打开 `/ffa/mshop/homepage/index`，让 Cookie 在抖店域就绪（也可用变量跳过）。
4. **进服务市场（可选分支）**：打开配置的服务市场页 → 等待侧栏「常用服务 / 已购服务」类文案 → 在**限定容器内**点击「晓风上货」入口（避免误点页面中间其它大卡）。
5. **处理多标签 / iframe**：晓风常在弹窗或 iframe 里，代码里会切换页面、定位 frame，再继续点击。
6. **到达低价好物页**：默认 URL 可指向 zzbtool 上的路由；也可由环境变量改成你的测试地址。
7. **后续筛选 / 抓取**：在页面内点击、等待表格、导出候选等（具体步骤随业务迭代，顺着 `run` 里日志前缀 `[xf-1.1]` 读最容易）。

**UI 步骤 id / 日志行格式** 与控制台任务进度共用：**`ui-pipeline.ts`**。  
复杂点击策略请看 **`clickXiaofengInFrame`** 一带的注释；与 MCP 对齐时对照 **`tests/mcp/contracts/xf-low-goods-mcp-contract.ts`**。

<!-- END:MANUAL:FEATURE_FOLDER_README -->
