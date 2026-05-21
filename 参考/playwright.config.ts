import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(repoRoot, ".env") });

const headed =
  process.env.PLAYWRIGHT_HEADED &&
  ["1", "true", "yes", "on"].includes(process.env.PLAYWRIGHT_HEADED.trim().toLowerCase());

/** 本仓库不再维护 Playwright `*.spec.ts`；用例由 AI + MCP（见 tests/mcp/）。保留配置供 codegen 等。 */
export default defineConfig({
  testDir: path.join(repoRoot, "tests", "specs"),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    headless: !headed,
    /**
     * 默认保留失败时的证据：
     * - trace：便于回放（含截图、网络、操作）
     * - screenshot：失败时落盘
     * - video：失败时保留录屏
     */
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  timeout: 180_000,
  expect: { timeout: 15_000 },
  metadata: { repoRoot },
});
