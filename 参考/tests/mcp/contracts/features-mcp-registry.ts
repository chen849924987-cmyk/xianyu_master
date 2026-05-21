/**
 * 与 `src/features/index.ts` 注册表一一对应的 MCP 验证入口。
 * AI / 人类按 `protocolMarkdown` 用 Playwright MCP 实录；跑完写入 `.data/mcp-session-records/`。
 * 与 `dist` 的 id/displayName/文件存在性对齐由 `tests/mcp/scripts/verify-offline.ts`（`npm run test`）校验。
 */
export type FeatureMcpRegistryEntry = {
  id: string;
  displayName: string;
  featureModulePath: string;
  /** 相对仓库根的 MCP 步骤文档 */
  protocolMarkdown: string;
  /** 是否需要有效 Playwright storageState（默认 `.data/storage-state.json`） */
  needsStorageState: boolean;
  /** 可选：额外契约 TS（仅 xf 等有 DOM 计数契约） */
  contractModulePath?: string;
};

export const FEATURE_MCP_REGISTRY: readonly FeatureMcpRegistryEntry[] = [
  {
    id: "chain-smoke",
    displayName: "链路冒烟（公网示例页）",
    featureModulePath: "src/features/chain-smoke/index.ts",
    protocolMarkdown: "tests/mcp/features/chain-smoke.md",
    needsStorageState: false,
  },
  {
    id: "login",
    displayName: "登录",
    featureModulePath: "src/features/login/index.ts",
    protocolMarkdown: "tests/mcp/features/login.md",
    needsStorageState: false,
  },
  {
    id: "dashboard",
    displayName: "工作台",
    featureModulePath: "src/features/dashboard/index.ts",
    protocolMarkdown: "tests/mcp/features/dashboard.md",
    needsStorageState: true,
  },
  {
    id: "session-verify",
    displayName: "登录态校验（工作台）",
    featureModulePath: "src/features/session-verify/index.ts",
    protocolMarkdown: "tests/mcp/features/session-verify.md",
    needsStorageState: true,
  },
  {
    id: "feige-workspace",
    displayName: "飞鸽工作台",
    featureModulePath: "src/features/feige-workspace/index.ts",
    protocolMarkdown: "tests/mcp/features/feige-workspace.md",
    needsStorageState: true,
  },
  {
    id: "xf-ali-find-low-goods",
    displayName: "晓风上货·低价好物筛选（1.1）",
    featureModulePath: "src/features/xf-ali-find-low-goods/index.ts",
    protocolMarkdown: "tests/mcp/features/xf-ali-find-low-goods.md",
    needsStorageState: true,
    contractModulePath: "tests/mcp/contracts/xf-low-goods-mcp-contract.ts",
  },
] as const;
