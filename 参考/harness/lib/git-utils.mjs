import { execFileSync } from "node:child_process";

export function git(cwd, args, allowFail = false) {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (e) {
    if (allowFail) return "";
    throw e;
  }
}

export function isGitRepo(cwd) {
  try {
    git(cwd, ["rev-parse", "--git-dir"]);
    return true;
  } catch {
    return false;
  }
}

export function hasChanges(cwd) {
  return git(cwd, ["status", "--porcelain"]).length > 0;
}

export function formatLocalTime(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
