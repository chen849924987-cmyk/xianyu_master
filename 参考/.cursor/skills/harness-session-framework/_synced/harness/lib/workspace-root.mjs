import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

function isGitRoot(dir) {
  try {
    return existsSync(join(dir, ".git"));
  } catch {
    return false;
  }
}

function norm(p) {
  return String(p || "")
    .replace(/\\/g, "/")
    .replace(/\/+$/, "");
}

function gitRepoRoot(cwd) {
  const dir = String(cwd || process.cwd());
  try {
    const out = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const top = out.trim();
    return top || "";
  } catch {
    return "";
  }
}

/**
 * Cursor hooks 常用路径：若 payload 未带 workspace_roots，仅用 cwd 容易落到非仓库目录；
 * 此时用「cwd 下的 git 顶层」作为 harness 根目录（与 session-start-context 一致）。
 */
export function resolveHarnessRepoRoot(workspaceRoots, cwd = process.cwd()) {
  const roots = Array.isArray(workspaceRoots) ? workspaceRoots.filter(Boolean) : [];
  const c = cwd || process.cwd();
  if (roots.length > 0) return pickWorkspaceRoot(roots, c);
  const g = gitRepoRoot(c);
  return g || c;
}

/**
 * 多根工作区：优先选「当前 cwd 所在」的 git 根，否则第一个含 .git 的根，否则 roots[0]，否则 cwd。
 */
export function pickWorkspaceRoot(workspaceRoots, cwd = process.cwd()) {
  const roots = Array.isArray(workspaceRoots) ? workspaceRoots.filter(Boolean) : [];
  const c = norm(cwd);
  const gitRoots = roots.filter((r) => isGitRoot(r));
  const candidates = gitRoots.length ? gitRoots : roots;

  for (const r of candidates) {
    const n = norm(r);
    if (!n) continue;
    if (c === n || c.startsWith(`${n}/`)) return r;
  }
  if (candidates[0]) return candidates[0];
  if (roots[0]) return roots[0];
  return cwd;
}
