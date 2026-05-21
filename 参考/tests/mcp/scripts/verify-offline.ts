/**
 * 离线校验（原 specs/unit 逻辑）：注册表、xf 契约、登录墙启发式、密码登录配置检测。
 * CI / 本地：`npm run test`（先 build）；AI 亦可单独 `npx tsx tests/mcp/scripts/verify-offline.ts`。
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { FEATURE_MCP_REGISTRY } from "../contracts/features-mcp-registry.js";
import { xfLowGoodsMcpContract } from "../contracts/xf-low-goods-mcp-contract.js";
import { loginWallCases } from "../../pure/login-wall-cases.js";
import { resolveRepoRoot } from "../../support/repo-root.js";
import { spawnIsPasswordLoginConfigured } from "../../support/spawn-password-login-configured.js";

const root = resolveRepoRoot(import.meta.url);

function die(msg: string): never {
  console.error(msg);
  process.exit(1);
}

function cleanPasswordEnv(): Record<string, string | undefined> {
  const e: Record<string, string | undefined> = { ...process.env };
  delete e.DOUDIAN_PASSWORD_LOGIN;
  delete e.DOUDIAN_LOGIN_EMAIL;
  delete e.DOUDIAN_LOGIN_PASSWORD;
  return e;
}

async function verifyLoginWall(): Promise<void> {
  const href = pathToFileURL(path.join(root, "dist", "utils", "doudian-password-login.js")).href;
  let isLikelyFxgLoginWall: (url: string) => boolean;
  try {
    const mod = (await import(href)) as { isLikelyFxgLoginWall: (url: string) => boolean };
    isLikelyFxgLoginWall = mod.isLikelyFxgLoginWall;
  } catch (err) {
    die(`无法加载 dist/utils/doudian-password-login.js（请先 npm run build）\n${String(err)}`);
  }
  for (const c of loginWallCases) {
    const got = isLikelyFxgLoginWall(c.url);
    if (got !== c.expected) {
      die(`isLikelyFxgLoginWall「${c.label}」: 期望 ${c.expected}，实际 ${got}`);
    }
  }
  console.log(`[verify-offline] login-wall: ${loginWallCases.length} cases ok`);
}

async function verifyPasswordLoginConfig(): Promise<void> {
  const cases: { label: string; env: Record<string, string | undefined>; expected: boolean }[] = [
    { label: "未启用密码登录且无凭据", env: cleanPasswordEnv(), expected: false },
    {
      label: "仅 DOUDIAN_PASSWORD_LOGIN=1 无邮箱密码",
      env: { ...cleanPasswordEnv(), DOUDIAN_PASSWORD_LOGIN: "1" },
      expected: false,
    },
    {
      label: "DOUDIAN_PASSWORD_LOGIN=1 且邮箱密码齐全",
      env: {
        ...cleanPasswordEnv(),
        DOUDIAN_PASSWORD_LOGIN: "1",
        DOUDIAN_LOGIN_EMAIL: "e2e-placeholder@example.com",
        DOUDIAN_LOGIN_PASSWORD: "not-a-real-secret",
      },
      expected: true,
    },
  ];
  for (const c of cases) {
    const got = await spawnIsPasswordLoginConfigured(c.env);
    if (got !== c.expected) {
      die(`isPasswordLoginConfigured「${c.label}」: 期望 ${c.expected}，实际 ${got}`);
    }
  }
  console.log("[verify-offline] password-login-config: 3 scenarios ok");
}

async function verifyFeatureRegistry(): Promise<void> {
  const href = pathToFileURL(path.join(root, "dist", "features", "index.js")).href;
  let listFeatures: () => readonly { id: string; displayName: string }[];
  try {
    const mod = (await import(href)) as { listFeatures: typeof listFeatures };
    listFeatures = mod.listFeatures;
  } catch (err) {
    die(`无法加载 dist/features/index.js（请先 npm run build）\n${String(err)}`);
  }
  const fromSrc = new Set(listFeatures().map((f) => f.id));
  const fromReg = new Set(FEATURE_MCP_REGISTRY.map((e) => e.id));
  if (fromSrc.size !== fromReg.size || [...fromReg].some((id) => !fromSrc.has(id))) {
    die(
      `FEATURE_MCP_REGISTRY 与 listFeatures() id 不一致\n  registry: ${[...fromReg].sort().join(", ")}\n  dist:     ${[...fromSrc].sort().join(", ")}`,
    );
  }
  const displayById = new Map(listFeatures().map((f) => [f.id, f.displayName]));
  for (const e of FEATURE_MCP_REGISTRY) {
    if (e.displayName !== displayById.get(e.id)) {
      die(
        `displayName 不一致（${e.id}）：registry「${e.displayName}」vs dist「${displayById.get(e.id)}」`,
      );
    }
    const proto = path.join(root, e.protocolMarkdown);
    if (!fs.existsSync(proto)) {
      die(`缺少 MCP 协议文件：${e.protocolMarkdown}`);
    }
    if (e.contractModulePath) {
      const p = path.join(root, e.contractModulePath);
      if (!fs.existsSync(p)) {
        die(`缺少契约文件：${e.contractModulePath}`);
      }
    }
  }
  console.log(`[verify-offline] features-mcp-registry: ${FEATURE_MCP_REGISTRY.length} features ok`);
}

async function verifyXfContract(): Promise<void> {
  const c = xfLowGoodsMcpContract;
  if (c.featureId !== "xf-ali-find-low-goods") die("xf contract: featureId");
  if (!c.storageStateDefaultRelative.match(/storage-state/)) {
    die("xf contract: storageStateDefaultRelative");
  }
  if (!c.workbenchPath.includes("ffa/mshop")) die("xf contract: workbenchPath");
  if (c.postFuwuDomExpectations.minLocatorCountCommonServices < 1) {
    die("xf contract: minLocatorCountCommonServices");
  }
  if (c.postFuwuDomExpectations.minLocatorCountXiaofeng < 1) {
    die("xf contract: minLocatorCountXiaofeng");
  }
  if (c.postFuwuDomExpectations.pageTitleIncludes.length <= 0) {
    die("xf contract: pageTitleIncludes");
  }
  const uiHref = pathToFileURL(
    path.join(root, "dist", "features", "xf-ali-find-low-goods", "ui-pipeline.js"),
  ).href;
  try {
    const { XF_LOW_GOODS_UI_FEATURE_ID } = (await import(uiHref)) as {
      XF_LOW_GOODS_UI_FEATURE_ID: string;
    };
    if (c.featureId !== XF_LOW_GOODS_UI_FEATURE_ID) {
      die(
        `xf contract vs ui-pipeline: featureId「${c.featureId}」≠「${XF_LOW_GOODS_UI_FEATURE_ID}」`,
      );
    }
  } catch (err) {
    die(`无法加载 dist/features/xf-ali-find-low-goods/ui-pipeline.js\n${String(err)}`);
  }
  console.log("[verify-offline] xf-low-goods-mcp-contract: ok");
}

async function main(): Promise<void> {
  await verifyLoginWall();
  await verifyPasswordLoginConfig();
  await verifyFeatureRegistry();
  await verifyXfContract();
  console.log("[verify-offline] all checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
