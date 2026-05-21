/**
 * Git post-commit：把当前 HEAD 写入 AGENT_TASK_PROTOCOL.md 提交记录区。
 */
import { execFileSync } from "node:child_process";
import {
  appendCommitDetailBlock,
  appendCommitLogLine,
  capCommitDetailText,
  ensureProtocolFile,
} from "../lib/agent-protocol-md.mjs";
import { git } from "../lib/git-utils.mjs";

function escapeSubject(s) {
  return String(s || "")
    .replace(/`/g, "'")
    .replace(/\r?\n/g, " ")
    .trim()
    .slice(0, 240);
}

export function shouldSkipCommitProtocolLog(root) {
  if (process.env.SKIP_PROTOCOL_COMMIT_LOG === "1") return true;
  if (process.env.HARNESS_SKIP_COMMIT_PROTOCOL_LOG === "1") return true;
  const subj = git(root, ["log", "-1", "--format=%s"], true).trim();
  if (subj === "chore: sync handoff files") return true;
  return false;
}

export function shouldSkipCommitProtocolDetail(root) {
  if (process.env.HARNESS_SKIP_COMMIT_PROTOCOL_DETAIL === "1") return true;
  return shouldSkipCommitProtocolLog(root);
}

function gitShowForProtocol(root, includePatch) {
  const args = ["show", "-1", "--no-color", "--pretty=medium"];
  if (includePatch) args.push("-p");
  else args.push("--stat");
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 48 * 1024 * 1024,
  });
}

/** 在协议文件中追加一行，对应「刚刚完成」的这次提交（HEAD）。 */
export function recordCurrentCommitInProtocol(root) {
  ensureProtocolFile(root);
  const iso = git(root, ["log", "-1", "--format=%cI"], true).trim();
  const short = git(root, ["log", "-1", "--format=%h"], true).trim();
  const subj = git(root, ["log", "-1", "--format=%s"], true).trim();
  if (!iso || !short) return;
  const line = `- **${iso}** · \`${short}\` · ${escapeSubject(subj)}`;
  appendCommitLogLine(root, line);
}

/** 在「提交改动明细」区追加当前 HEAD 的 show 输出（stat 或 patch）。 */
export function recordCommitDetailSessionInProtocol(root) {
  if (shouldSkipCommitProtocolDetail(root)) return;
  ensureProtocolFile(root);
  const short = git(root, ["log", "-1", "--format=%h"], true).trim();
  const iso = git(root, ["log", "-1", "--format=%ci"], true).trim();
  const subj = escapeSubject(git(root, ["log", "-1", "--format=%s"], true));
  if (!short || !iso) return;
  const includePatch = process.env.HARNESS_COMMIT_PROTOCOL_PATCH === "1";
  const raw = gitShowForProtocol(root, includePatch);
  const body = capCommitDetailText(raw);
  const mode = includePatch ? "medium + patch" : "medium + stat";
  const section = `#### \`${short}\` · ${iso} · ${subj}\n\n_${mode}_\n\n~~~text\n${body}\n~~~\n`;
  appendCommitDetailBlock(root, section);
}
