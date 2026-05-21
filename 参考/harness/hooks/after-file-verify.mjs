#!/usr/bin/env node
/**
 * afterFileEdit：对命中路径的源码保存后运行验证命令，成功则写入 .data/harness-verify.json
 * 需 HARNESS_AFTER_EDIT_VERIFY=1（默认关闭，避免每次保存全量 build）
 * stdin: { file_path, edits? }
 */
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import {
  gitRootFromFile,
  fileTriggersAfterEditVerify,
  isAfterEditVerifyEnabled,
  runVerifyAndRecordEvidence,
} from "../lib/verify-evidence.mjs";

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function main() {
  if (!isAfterEditVerifyEnabled()) {
    console.log(JSON.stringify({}));
    return;
  }

  let data = {};
  try {
    data = JSON.parse(readStdin() || "{}");
  } catch {
    /* ignore */
  }

  const filePath = typeof data.file_path === "string" ? data.file_path : "";
  if (!filePath) {
    console.log(JSON.stringify({}));
    return;
  }

  const root = gitRootFromFile(filePath);
  if (!root) {
    console.log(JSON.stringify({}));
    return;
  }

  if (!fileTriggersAfterEditVerify(filePath, root)) {
    console.log(JSON.stringify({}));
    return;
  }

  const rel = relative(root, filePath).replace(/\\/g, "/");

  runVerifyAndRecordEvidence(root, {
    trigger: "afterFileEdit",
    trigger_file: rel,
  });

  console.log(JSON.stringify({}));
}

main();
