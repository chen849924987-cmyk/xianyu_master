/**
 * src/features/<dir>/README.md 中「MANUAL」区块默认正文：给用户看的代码流程（白话）。
 */
/** @param {string} id */
export function getFolderReadmeFlowPreset(id) {
  return PRESETS[id] ?? "";
}

/** @type {Record<string, string>} */
const PRESETS = {
  "chain-smoke": `## 这个 Feature 在干什么？

像「体检」一样：**不登录抖店**，只打开一个公开网页，确认程序能正常启动浏览器、打开页面、读到标题。用来证明整条工具链没坏。

## 代码大致怎么走？

1. **入口**：\`FeatureModule.run\` 收到 Playwright 的 \`page\`。
2. **打开页面**：访问常量里的示例网址（\`example.com\`）。
3. **检查结果**：HTTP 要成功；页面标题里要出现「Example Domain」字样。
4. **结束**：打日志；不对就抛错，让你在终端立刻看到。

对应源码主要在 **\`index.ts\`** 里，逻辑很短，适合新人先看懂「Feature 长什么样」。`,

  login: `## 这个 Feature 在干什么？

帮你完成「**登录抖店后台**」这件事：要么用**已经保存好的登录状态文件**，要么按配置用**邮箱 + 密码自动登录**（遇到滑块/验证码通常要人在浏览器里帮一下）。

## 代码大致怎么走？

1. **看配置**：调用 \`isPasswordLoginConfigured()\` 判断是否走「自动密码登录」分支。
2. **分支 A — 不配密码**：打开门户首页（\`baseUrl/\`），假设本地已有可用的 \`storage-state\`；稍作等待后继续下一步。
3. **分支 B — 配了密码**：走 \`performPasswordLogin\`（具体填表、点按钮在工具函数里）。
4. **统一收尾**：调用 \`openWorkbenchAndAssertLoggedIn\`，确认最终落到**工作台**而不是登录墙。
5. **可选写回登录态**：若开关允许且是密码登录成功，可把当前 Cookie 写回文件，方便下次免登录。

细节都在 **\`index.ts\`**；密码相关底层在 **\`src/utils/\`**（与抖店页面结构绑定）。`,

  dashboard: `## 这个 Feature 在干什么？

打开卖家后台的**工作台首页**（概览页）。前提是你已经有有效的登录态，否则会停在登录页。

## 代码大致怎么走？

1. 用 Playwright \`page.goto\` 打开：\`{抖店后台域名}/ffa/mshop/homepage/index\`。
2. 打一行日志提示「已打开」。
3. 后续业务步骤可以继续在同一个 \`run\` 里往下写。

源码只在 **\`index.ts\`**，非常短，通常当作「从工作台起步」的模板。`,

  "session-verify": `## 这个 Feature 在干什么？

**检查当前保存的登录还有没有用**：用现有 Cookie 去打开工作台，看会不会被踢回登录页。

## 代码大致怎么走？

1. 打日志说明开始校验。
2. 调用 \`openWorkbenchAndAssertLoggedIn(page, baseUrl)\`：内部会导航并判断是否像登录墙。
3. 把 HTTP 状态、最终 URL、页面标题（截一段）打到日志里，方便你对照。
4. 若断言失败会直接抛错；成功则打印「通过」类日志。

源码在 **\`index.ts\`**，核心是复用工坊登录校验逻辑。`,

  "feige-workspace": `## 这个 Feature 在干什么？

打开 **飞鸽**（抖店客服 IM）工作台网页，确认能进到客服站点而不是无关登录页。

## 代码大致怎么走？

1. 从配置读 IM 根地址（常见 \`im.jinritemai.com\`，可由环境变量覆盖）。
2. 调用 \`openFeigeWorkspaceAndAssertLoggedIn\`：打开 IM、等待加载、按 URL/标题等判断是否像登录拦截。
3. 日志输出 HTTP、URL、标题摘要。

源码在 **\`index.ts\`**。**注意**：保存登录态时要覆盖 IM 域名，否则光有后台 Cookie 也可能进不去飞鸽。`,

  "xf-ali-find-low-goods": `## 这个 Feature 在干什么？

自动化「**晓风 · 低价好物**」相关页面流程：往往要先在抖店侧「热身」，再进服务市场点晓风入口，最后在第三方页或 iframe 里继续操作。步骤多、依赖登录态与 DOM，失败时会自动留截图/trace 方便排查。

## 代码大致怎么走？（按阶段理解即可）

1. **读环境变量**：决定是否跳过抖店首页、是否走「抖店 → 服务市场 → 点晓风」、服务市场 URL、低价好物直达链接等（详见 **\`index.ts\` 文件头注释**）。
2. **可选 tracing / 失败落盘**：失败时截屏、HTML、trace zip（Web 任务可与控制台产物目录统一）。
3. **落地抖店工作台（默认）**：先打开 \`/ffa/mshop/homepage/index\`，让 Cookie 在抖店域就绪（也可用变量跳过）。
4. **进服务市场（可选分支）**：打开配置的服务市场页 → 等待侧栏「常用服务 / 已购服务」类文案 → 在**限定容器内**点击「晓风上货」入口（避免误点页面中间其它大卡）。
5. **处理多标签 / iframe**：晓风常在弹窗或 iframe 里，代码里会切换页面、定位 frame，再继续点击。
6. **到达低价好物页**：默认 URL 可指向 zzbtool 上的路由；也可由环境变量改成你的测试地址。
7. **后续筛选 / 抓取**：在页面内点击、等待表格、导出候选等（具体步骤随业务迭代，顺着 \`run\` 里日志前缀 \`[xf-1.1]\` 读最容易）。

**UI 步骤 id / 日志行格式** 与控制台任务进度共用：**\`ui-pipeline.ts\`**。  
复杂点击策略请看 **\`clickXiaofengInFrame\`** 一带的注释；与 MCP 对齐时对照 **\`tests/mcp/contracts/xf-low-goods-mcp-contract.ts\`**。`,
};
