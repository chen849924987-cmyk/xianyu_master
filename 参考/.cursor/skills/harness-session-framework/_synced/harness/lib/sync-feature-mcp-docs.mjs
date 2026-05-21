/**
 * 根据 src/features 源码刷新 tests/mcp/features/<id>.md：
 * - <!-- AUTO:FEATURE_DOC --> … 始终由本脚本重写
 * - <!-- MANUAL:FEATURE_DOC --> … 若已存在则保留；否则注入预设小白/AI 说明
 *
 * 手动全量 MCP：node harness/lib/sync-feature-mcp-docs.mjs  
 * 与用户目录 README 一并：node harness/lib/sync-all-feature-docs.mjs（等同 npm run sync:feature-docs）
 * 禁用 hook：HARNESS_SKIP_FEATURE_MCP_DOC_SYNC=1
 */
import { existsSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { listOrderedFeatureModules } from "./sync-readme-features.mjs";
import { getManualPreset } from "./feature-doc-manual-presets.mjs";
import {
  readUtf8,
  extractFeatureDocComment,
  collectUrls,
  collectProcessEnvKeys,
  collectFeatureSources,
} from "./feature-source-meta.mjs";

const AUTO_START = "<!-- AUTO:FEATURE_DOC -->";
const AUTO_END = "<!-- END:AUTO:FEATURE_DOC -->";
const MANUAL_START = "<!-- MANUAL:FEATURE_DOC -->";
const MANUAL_END = "<!-- END:MANUAL:FEATURE_DOC -->";

/**
 * @param {string} repoRoot
 * @param {{ id: string, displayName: string, dir: string }} mod
 */
export function buildAutoFeatureDocSection(repoRoot, mod) {
  const indexPath = join(repoRoot, "src", "features", mod.dir, "index.ts");
  const indexTs = existsSync(indexPath) ? readUtf8(indexPath) : "";
  const { combined: allTs, files } = collectFeatureSources(repoRoot, mod.dir);
  const jsdoc = extractFeatureDocComment(indexTs);
  const urls = collectUrls(allTs);
  const envKeys = collectProcessEnvKeys(allTs);

  const relFiles = files.map((f) => `src/features/${mod.dir}/${f}`).join("、");

  const lines = [
    AUTO_START,
    "> **本区块由仓库 hook / `node harness/lib/sync-feature-mcp-docs.mjs` 根据源码自动生成**，请勿手工编辑；要写补充说明请改下方「手册区」。",
    "",
    "## 同步摘要（机读）",
    "",
    `- **id**：\`${mod.id}\``,
    `- **名称**：${mod.displayName}`,
    `- **源码目录**：\`src/features/${mod.dir}/\``,
    `- **相关文件**：${relFiles || "—"}`,
    "",
  ];

  if (jsdoc) {
    lines.push("### 源码顶部说明（摘录）", "", "```text", jsdoc, "```", "");
  }

  if (urls.length) {
    lines.push("### 文中出现的 URL（自动抓取，便于 MCP 对照）", "");
    for (const u of urls) {
      lines.push(`- ${u}`);
    }
    lines.push("");
  }

  if (envKeys.length) {
    lines.push("### 涉及的 \`process.env.*\`（自动抓取）", "");
    lines.push(envKeys.map((k) => `\`${k}\``).join("、"));
    lines.push("");
  }

  lines.push("### CLI 快速对照", "", "```bash", `npm run dev -- --feature=${mod.id}`, "```", "");

  if (mod.id === "xf-ali-find-low-goods") {
    lines.push(
      "### 契约与离线校验",
      "",
      "- 结构化契约：**`tests/mcp/contracts/xf-low-goods-mcp-contract.ts`**",
      "- 注册表条目：**`tests/mcp/contracts/features-mcp-registry.ts`**",
      "- 离线：`npm run test`（内含 `verify-offline.ts`，非浏览器）",
      "",
    );
  } else {
    lines.push(
      "### 注册表",
      "",
      "- 本 Feature 在 **`tests/mcp/contracts/features-mcp-registry.ts`** 中登记；离线对齐见 **`npm run test`**。",
      "",
    );
  }

  lines.push("### MCP 推荐顺序（给 AI 的步骤骨架）", "");
  switch (mod.id) {
    case "chain-smoke":
      lines.push(
        "1. **`browser_navigate`** → `https://example.com/`",
        "2. **`browser_snapshot`**（或 `browser_run_code_unsafe` 读 `page.title()`）",
        "3. **期望**：标题匹配 `/Example Domain/i`",
        "",
      );
      break;
    case "login":
      lines.push(
        "- **路径 A（仅有 storage）**：用带 `storageState` 的浏览器上下文打开门户根路径 → 按 `openWorkbenchAndAssertLoggedIn` 落到工作台（常见 `/ffa/mshop/homepage/index`），快照中不应像典型登录墙。",
        "- **路径 B（密码登录）**：仅在本地 `.env` 已配置且合规时使用自动化填表；遇滑块/验证码 → **暂停脚本**，人工处理后继续 BEFORE/AFTER 快照。",
        "",
      );
      break;
    case "dashboard":
      lines.push(
        "1. `browser_run_code_unsafe`：`browser.newContext({ storageState: '<仓库>/.data/storage-state.json' })` 新开页面",
        "2. `goto` → `{DOUDIAN_BASE_URL}/ffa/mshop/homepage/index`",
        "3. **`browser_snapshot`**：确认工作台已加载",
        "",
      );
      break;
    case "session-verify":
      lines.push(
        "- 与 **dashboard** 相同入口（storage + 工作台路径）。",
        "- 对照 CLI 日志：`HTTP`、`finalUrl`、`title`；快照应显示仍停留在后台而非登录墙。",
        "",
      );
      break;
    case "feige-workspace":
      lines.push(
        "1. 使用含 IM Cookie 的 `storageState`",
        "2. **`browser_navigate`** → `DOUDIAN_IM_BASE_URL`（常为 `https://im.jinritemai.com`）",
        "3. **期望**：进入飞鸽相关界面或未拦截在无关登录页",
        "",
      );
      break;
    case "xf-ali-find-low-goods":
      lines.push(
        "1. **工作台**：带 `storageState` 打开 `https://fxg.jinritemai.com/ffa/mshop/homepage/index`（或当前 `DOUDIAN_BASE_URL` 同路径），确认标题/URL 不像登录墙。",
        "2. **服务市场**：打开契约中的 `fuwuPathExample` 或 env 配置的 URL → 静置约 `sidecarWaitMsHint` ms → 用 locator 计数对照 **`xfLowGoodsMcpContract.postFuwuDomExpectations`**。",
        "3. **深入晓风**：涉及 iframe/侧栏点击策略，务必对照源码注释 **`clickStrategyNote`** 与契约字段。",
        "",
      );
      break;
    default:
      lines.push("- （无专用骨架）按源码 `run()` 顺序自拟 MCP 步骤。", "");
  }

  lines.push(
    "### MCP 实录要求",
    "",
    "- 结论写入 **`.data/mcp-session-records/`**，模板 **`docs/script/mcp-session-record.md`**。",
    "- Playwright MCP 工具名以 Cursor 启用 **`user-playwright`** 为准（如 \`browser_navigate\` / \`browser_snapshot\` / \`browser_run_code_unsafe\`）。",
    "",
    AUTO_END,
  );

  return lines.join("\n");
}

/**
 * @param {string} body
 * @returns {{ manual: string | null }}
 */
function extractManualBlock(body) {
  const si = body.indexOf(MANUAL_START);
  const ei = body.indexOf(MANUAL_END);
  if (si < 0 || ei < 0 || ei <= si) return { manual: null };
  return { manual: body.slice(si + MANUAL_START.length, ei).trim() };
}

/**
 * @param {string} id
 * @param {string | null} existingManual
 */
function buildManualSection(id, existingManual) {
  const inner = (existingManual && existingManual.length > 0 ? existingManual : getManualPreset(id)).trim();
  if (!inner) {
    return `${MANUAL_START}\n\n（请在此编写小白说明与 AI 测试要点）\n\n${MANUAL_END}`;
  }
  return `${MANUAL_START}\n\n${inner}\n\n${MANUAL_END}`;
}

/**
 * @param {string} repoRoot
 * @param {{ id: string, displayName: string, dir: string }} mod
 * @returns {{ changed: boolean }}
 */
export function syncOneFeatureMcpDoc(repoRoot, mod) {
  const outDir = join(repoRoot, "tests", "mcp", "features");
  const outPath = join(outDir, `${mod.id}.md`);

  let prev = "";
  if (existsSync(outPath)) {
    prev = readUtf8(outPath);
  }

  const title = `# Feature：\`${mod.id}\`（${mod.displayName}）`;
  const auto = buildAutoFeatureDocSection(repoRoot, mod);
  const { manual: manualInner } = extractManualBlock(prev);
  const manual = buildManualSection(mod.id, manualInner);

  const pieces = [
    title,
    "",
    "> 本文档面向：**新手读懂用途** + **AI 按 MCP 做实测**。上方摘要随源码自动更新；下方「手册区」可人工润色。",
    "",
    auto,
    "",
    manual,
    "",
  ];
  const next = pieces.join("\n");

  if (next === prev) {
    return { changed: false };
  }
  writeFileSync(outPath, next, "utf8");
  return { changed: true };
}

/**
 * @param {string} repoRoot
 * @returns {{ changedFiles: string[] }}
 */
export function syncAllFeatureMcpDocs(repoRoot) {
  const mods = listOrderedFeatureModules(repoRoot);
  /** @type {string[]} */
  const changedFiles = [];
  for (const mod of mods) {
    const { changed } = syncOneFeatureMcpDoc(repoRoot, mod);
    if (changed) {
      changedFiles.push(relative(repoRoot, join(repoRoot, "tests", "mcp", "features", `${mod.id}.md`)));
    }
  }
  return { changedFiles };
}

function main() {
  const repoRoot = process.cwd();
  const { changedFiles } = syncAllFeatureMcpDocs(repoRoot);
  if (changedFiles.length) {
    console.error("[feature-mcp-docs] updated:\n" + changedFiles.map((f) => `  - ${f}`).join("\n"));
  } else {
    console.error("[feature-mcp-docs] already up to date");
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
