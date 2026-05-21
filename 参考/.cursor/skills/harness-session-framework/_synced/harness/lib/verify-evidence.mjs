/**
 * 验证证据：编辑后 / 收尾前 —— 「不让模型自证，只认进程与工作区快照」
 * 成功验证写入 .data/harness-verify.json；收尾时比对 tree_signature + 时效。
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { git } from "./git-utils.mjs";

export const VERIFY_FILE = "harness-verify.json";

export function isVerifyRequired() {
  return process.env.HARNESS_REQUIRE_VERIFY === "1";
}

export function isAfterEditVerifyEnabled() {
  return process.env.HARNESS_AFTER_EDIT_VERIFY === "1";
}

export function verifyPathSpecs() {
  return (process.env.HARNESS_VERIFY_PATHSPECS || "src package.json tsconfig.json")
    .split(/\s+/)
    .filter(Boolean);
}

export function verifyMaxAgeMs() {
  return Number(process.env.HARNESS_VERIFY_MAX_AGE_MS || 600_000);
}

export function verifyCommandParts() {
  const raw = (process.env.HARNESS_VERIFY_CMD || "npm run build").trim();
  if (!raw) return { cmd: "npm", args: ["run", "build"] };
  if (raw === "npm run build") {
    return process.platform === "win32" ? { cmd: "npm.cmd", args: ["run", "build"] } : { cmd: "npm", args: ["run", "build"] };
  }
  const isWin = process.platform === "win32";
  if (isWin) {
    return { cmd: process.env.ComSpec || "cmd.exe", args: ["/d", "/s", "/c", raw] };
  }
  return { cmd: "/bin/sh", args: ["-c", raw] };
}

export function gitRootFromFile(absolutePath) {
  const dir = dirname(absolutePath);
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
}

function normRel(root, absPath) {
  try {
    return relative(root, absPath).replace(/\\/g, "/");
  } catch {
    return "";
  }
}

/** Agent 改动的文件是否应触发「编辑后验证」 */
export function fileTriggersAfterEditVerify(absFilePath, root) {
  const rel = normRel(root, absFilePath);
  if (!rel || rel.startsWith("..")) return false;
  if (rel.startsWith("harness/") || rel.startsWith(".cursor/") || rel.startsWith(".data/")) return false;
  if (/^AGENT_/i.test(rel) || rel === "HANDOFF.json") return false;
  if (/\.md$/i.test(rel)) return false;
  const specs = verifyPathSpecs();
  for (const spec of specs) {
    const s = spec.replace(/\/+$/, "");
    if (rel === s || rel.startsWith(`${s}/`)) {
      if (/\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/i.test(rel)) return true;
      if (/^(package\.json|tsconfig\.json|tsconfig\..*\.json)$/i.test(rel)) return true;
    }
  }
  return false;
}

function collectChangedPaths(root) {
  const names = new Set();
  const chunks = [
    git(root, ["diff", "--name-only", "HEAD"], true),
    git(root, ["diff", "--cached", "--name-only"], true),
    git(root, ["ls-files", "--others", "--exclude-standard"], true),
  ];
  for (const chunk of chunks) {
    for (const line of String(chunk).split("\n")) {
      const t = line.trim().replace(/\\/g, "/");
      if (t) names.add(t);
    }
  }
  return [...names];
}

export function pathMatchesVerifySpecs(relPosix) {
  const specs = verifyPathSpecs();
  for (const spec of specs) {
    const s = spec.replace(/\/+$/, "");
    if (relPosix === s || relPosix.startsWith(`${s}/`)) return true;
  }
  return false;
}

/** 工作区是否存在「需要验证」的未提交变更 */
export function hasVerifyRelevantChanges(root) {
  if (!existsSync(join(root, ".git"))) return false;
  for (const p of collectChangedPaths(root)) {
    if (pathMatchesVerifySpecs(p)) return true;
  }
  return false;
}

export function computeTreeSignature(root) {
  const specs = verifyPathSpecs();
  const h = createHash("sha256");
  h.update(git(root, ["rev-parse", "HEAD"], true) || "");
  for (const spec of specs) {
    h.update(git(root, ["diff", "HEAD", "--", spec], true) || "");
    h.update(git(root, ["diff", "--cached", "--", spec], true) || "");
  }
  const porc =
    specs.length > 0
      ? git(root, ["status", "--porcelain", "--", ...specs], true) || ""
      : "";
  h.update(porc);
  return h.digest("hex");
}

export function readVerifyEvidence(root) {
  const p = join(root, ".data", VERIFY_FILE);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

export function writeVerifyEvidence(root, payload) {
  const dir = join(root, ".data");
  mkdirSync(dir, { recursive: true });
  const body = { version: 1, ...payload };
  writeFileSync(join(dir, VERIFY_FILE), `${JSON.stringify(body, null, 2)}\n`, "utf8");
}

/** 运行验证命令；成功则写入证据。返回 { ok, exit_code, stderr_tail } */
export function runVerifyAndRecordEvidence(root, meta = {}) {
  const { cmd, args } = verifyCommandParts();
  let exit = 1;
  let out = "";
  let err = "";
  try {
    out = execFileSync(cmd, args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 20 * 1024 * 1024,
    });
    exit = 0;
  } catch (e) {
    exit = typeof e.status === "number" ? e.status : 1;
    out = e.stdout ? String(e.stdout) : "";
    err = e.stderr ? String(e.stderr) : String(e.message || e);
  }

  const tail = (err || out).slice(-4000);
  if (exit === 0) {
    writeVerifyEvidence(root, {
      ok: true,
      verified_at: new Date().toISOString(),
      tree_signature: computeTreeSignature(root),
      command: `${cmd} ${args.join(" ")}`.trim(),
      exit_code: 0,
      ...meta,
    });
  } else {
    writeVerifyEvidence(root, {
      ok: false,
      verified_at: new Date().toISOString(),
      tree_signature: computeTreeSignature(root),
      command: `${cmd} ${args.join(" ")}`.trim(),
      exit_code: exit,
      stderr_tail: tail,
      ...meta,
    });
  }
  return { ok: exit === 0, exit_code: exit, stderr_tail: tail };
}

/**
 * 收尾 / CLI 门禁：需 HARNESS_REQUIRE_VERIFY=1 时生效
 * @returns {string|null} 阻塞原因（中文），不阻塞返回 null
 */
export function getVerifyBlockReason(root) {
  if (!isVerifyRequired()) return null;
  if (!hasVerifyRelevantChanges(root)) return null;

  const ev = readVerifyEvidence(root);
  if (!ev || ev.ok !== true) {
    return (
      "已启用 HARNESS_REQUIRE_VERIFY：检测到 src/ 等路径有未提交变更，但尚无成功的验证记录。请先在本机执行通过的检查（默认 npm run build），或开启 HARNESS_AFTER_EDIT_VERIFY=1 让编辑后自动跑验证。"
    );
  }

  const sig = computeTreeSignature(root);
  if (ev.tree_signature !== sig) {
    return "已启用 HARNESS_REQUIRE_VERIFY：工作区相对上次成功验证已变化，请重新执行验证命令（默认 npm run build）后再收尾。";
  }

  const ts = Date.parse(ev.verified_at);
  if (!Number.isFinite(ts) || Date.now() - ts > verifyMaxAgeMs()) {
    const mins = Math.round(verifyMaxAgeMs() / 60000);
    return `已启用 HARNESS_REQUIRE_VERIFY：上次验证已超过 ${mins} 分钟，请重新执行验证后再收尾。`;
  }

  return null;
}
