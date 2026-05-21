/**
 * Feature MCP 文档中「手册区」默认正文（小白可读 + AI 测试线索）。
 * hook 仅在缺失 <!-- MANUAL:FEATURE_DOC --> 块时整段注入；已存在则保留人工改写。
 */
/** @type {Record<string, string>} */
export const FEATURE_MANUAL_PRESETS = {
  "chain-smoke": `## 给新手看的（白话）

这就像开车前先试一下刹车：**不用抖店账号**，只打开一个公开的示例网页（Example Domain）。若能正常打开并且标题对得上，说明「命令行 → 启动浏览器 → 跑脚本」这一条链路是通的。

## 给 AI 写 MCP 测试时的要点

- **不需要** \`storage-state.json\`。
- 用 **\`browser_navigate\`** 打开 \`https://example.com/\`，再 **\`browser_snapshot\`** 或 **\`browser_run_code_unsafe\`** 读 \`page.title()\`。
- **期望**：标题匹配 \`/Example Domain/i\`，与 CLI \`npm run dev -- --feature=chain-smoke\` 一致。
- 实录模板：**\`docs/script/mcp-session-record.md\`** → **\`.data/mcp-session-records/\`**。`,

  login: `## 给新手看的（白话）

这是「登录抖店后台」相关的脚本：  
- 若你**已经**用别的方式保存过登录状态（本仓库里是 \`.data/storage-state.json\` 一类文件），它会打开门户首页并**尝试确认你已经登录**。  
- 若你在本机 \`.env\` 里配置了**邮箱 + 密码自动登录**，它会走自动填表登录（遇到滑块/验证码时往往需要**真人**在浏览器里点一下）。

## 给 AI 写 MCP 测试时的要点

- **两条分支**：未配置密码登录 → 依赖 **storageState**；已配置 \`DOUDIAN_PASSWORD_LOGIN\` + 邮箱密码 → **\`performPasswordLogin\`**（ headed，验证码停自动化）。
- 最终都要落到 **工作台已登录** 的判定（与 \`openWorkbenchAndAssertLoggedIn\` / \`doudian-session\` 启发式一致），路径常见 **\`/ffa/mshop/homepage/index\`**。
- **不要**在对话里粘贴真实密码；对照 **\`tests/actions/doudian/password-login.ts\`** 与 **\`.cursor/rules/local-mcp-validation.mdc\`**。
- CLI 对照：\`npm run dev -- --feature=login\`。`,

  dashboard: `## 给新手看的（白话）

就是帮你打开抖店后台的**工作台首页**（卖家后台里看概况的那个页面）。  
前提是：你已经有一份有效的登录态文件，否则很容易停在登录页。

## 给 AI 写 MCP 测试时的要点

- **前置**：\`storage-state.json\`（或 \`STORAGE_STATE_PATH\`）有效。
- MCP：带 **\`storageState\`** 开 context，\`goto\` **工作台路径**（源码用 \`\${baseUrl}/ffa/mshop/homepage/index\`）。
- **期望**：快照里像正常后台，而不是典型登录墙 URL/文案。
- CLI 对照：\`npm run dev -- --feature=dashboard\`。`,

  "session-verify": `## 给新手看的（白话）

用来**检查「我现在还算不算登录成功」**：用当前保存的 Cookie 去打开工作台，看落地页是不是又被踢回登录。

## 给 AI 写 MCP 测试时的要点

- 与 **dashboard** 类似：带 storage 打开工作台路径。
- 对照源码日志里的 **HTTP 状态、finalUrl、title**；快照中确认 **未命中典型登录墙**。
- CLI 对照：\`npm run dev -- --feature=session-verify\`。`,

  "feige-workspace": `## 给新手看的（白话）

打开 **飞鸽**（抖店客服聊天工作台）对应的网站。  
注意：保存登录状态时，要覆盖到 **飞鸽用的域名**，否则光有后台 Cookie 也可能进不去飞鸽。

## 给 AI 写 MCP 测试时的要点

- **前置**：storage 里需包含 **IM 域** Cookie（常见 \`im.jinritemai.com\`，以 \`DOUDIAN_IM_BASE_URL\` 为准）。
- MCP：\`goto\` IM 根 URL → snapshot → 期望不像无关登录拦截页。
- CLI 对照：\`npm run dev -- --feature=feige-workspace\`。`,

  "xf-ali-find-low-goods": `## 给新手看的（白话）

这是 **「晓风 · 低价好物」** 一类自动化：步骤长，可能在抖店后台、服务市场、第三方晓风页面之间跳转。  
新手只要记住：**登录态要完整**，而且「从抖店进服务市场再点晓风」有时比「直接敲晓风网址」更稳（源码里用环境变量控制）。

## 给 AI 写 MCP 测试时的要点

- **契约**：精读 **\`tests/mcp/contracts/xf-low-goods-mcp-contract.ts\`**（DOM 计数下限、标题关键字、featureId 与 \`ui-pipeline.ts\` 一致）。
- **离线校验**：\`npm run test\` 中的 \`verify-offline.ts\` 会检查上述契约与注册表；**不等于**真网通过。
- MCP 建议步骤：先 **带 storage 打开抖店工作台** → 再按契约走 **服务市场**（示例 URL 见契约 / 源码 env）。
- 环境变量多（\`XF_NAV_VIA_DOUYIN\`、\`XF_SERVICE_MARKET_URL\` 等），改脚本后用 hook 刷新文档上半部的「源码摘要」。
- CLI 对照：\`npm run xf:low-goods\`（具体 env 见源码文件头注释）。`,
};

export function getManualPreset(id) {
  return FEATURE_MANUAL_PRESETS[id] ?? "";
}
