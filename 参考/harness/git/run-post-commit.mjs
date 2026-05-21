#!/usr/bin/env node
/**
 * Git post-commit：每次提交在 AGENT_TASK_PROTOCOL.md 追加一条记录；若 HANDOFF / 协议被改写则二次提交同步。
 */
import "../lib/load-harness-env.mjs";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  recordCommitDetailSessionInProtocol,
  recordCurrentCommitInProtocol,
  shouldSkipCommitProtocolLog,
} from "./append-commit-protocol-log.mjs";

function repoRoot() {
  return execFileSync("git", ["rev-parse", "--show-toplevel"], {
    cwd: process.cwd(),
    encoding: "utf8",
  }).trim();
}

function isFileDirty(cwd, relPath) {
  if (!existsSync(join(cwd, relPath))) return false;
  try {
    const out = execFileSync("git", ["status", "--porcelain", "--", relPath], {
      cwd,
      encoding: "utf8",
    });
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

function hasStagedChanges(cwd) {
  try {
    execFileSync("git", ["diff", "--cached", "--quiet"], { cwd, stdio: "ignore" });
    return false;
  } catch {
    return true;
  }
}

const root = repoRoot();
process.chdir(root);

if (!shouldSkipCommitProtocolLog(root)) {
  try {
    recordCurrentCommitInProtocol(root);
  } catch (e) {
    console.warn("harness post-commit: protocol commit log:", e.message || e);
  }
}
try {
  recordCommitDetailSessionInProtocol(root);
} catch (e) {
  console.warn("harness post-commit: protocol commit detail:", e.message || e);
}

const watch = ["HANDOFF.json", "AGENT_TASK_PROTOCOL.md"];
const dirty = watch.filter((f) => isFileDirty(root, f));
if (dirty.length === 0) process.exit(0);

execFileSync("git", ["add", ...dirty], { cwd: root, stdio: "inherit" });

if (!hasStagedChanges(root)) process.exit(0);

execFileSync("git", ["commit", "-m", "chore: sync handoff files"], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    SKIP_UPDATE_LOG: "1",
    SKIP_PROTOCOL_COMMIT_LOG: "1",
  },
});
