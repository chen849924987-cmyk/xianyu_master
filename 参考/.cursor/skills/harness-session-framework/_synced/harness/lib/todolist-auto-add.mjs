/**
 * 收尾词中带任务序号但 AGENT_TODOLIST.md 尚无对应行时，自动插入表格行。
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CN_MAJOR = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];

const ANCHOR_FEATURES = "## 与代码结构的对应关系";

export function extractDescriptionAfterTaskId(prompt, id) {
  const escaped = id.replace(/\./g, "\\.");
  const re = new RegExp(`\\b${escaped}\\b`);
  const m = re.exec(prompt);
  if (!m) return "";
  const rest = prompt.slice(m.index + m[0].length);
  const nextId = rest.match(/\b([1-9]\d*)\.(\d{1,2})\b/);
  const cut = nextId ? nextId.index : rest.length;
  return rest
    .slice(0, cut)
    .replace(/^[，,。.!！\s]+/, "")
    .trim()
    .slice(0, 200);
}

export function sanitizeTodolistDescription(raw) {
  return String(raw || "")
    .replace(/\|/g, "／")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function rowExistsForId(content, id) {
  const [maj, min] = id.split(".").map(Number);
  const re = new RegExp(`^\\| \\[[ x]\\] \\| ${maj}\\.${min}\\s`, "m");
  return re.test(content);
}

function insertIntoTaskTable(section, minor, newRow) {
  const lines = section.split(/\r?\n/);
  let sepIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\| --- \| --- \| --- \|/.test(lines[i])) {
      sepIdx = i;
      break;
    }
  }
  if (sepIdx === -1) return null;
  let insertAt = sepIdx + 1;
  for (let i = sepIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("|")) break;
    const mm = line.match(/^\| \[[ x]\] \| \d+\.(\d+)\s/);
    if (!mm) break;
    const ex = Number(mm[1], 10);
    if (minor < ex) {
      insertAt = i;
      break;
    }
    insertAt = i + 1;
  }
  lines.splice(insertAt, 0, newRow);
  return lines.join("\n");
}

function insertRowIntoMajorSection(content, major, minor, newRow) {
  const cn = CN_MAJOR[major - 1];
  if (!cn) return null;
  const sectionMarker = `## ${cn}、`;
  let idx = content.indexOf(sectionMarker);

  if (idx === -1) {
    if (major <= 4) return null;
    const ai = content.indexOf(ANCHOR_FEATURES);
    if (ai === -1) return null;
    const block = `\n## ${cn}、扩展任务\n\n| 状态 | 任务 | 完成时间 |\n| --- | --- | --- |\n${newRow}\n\n`;
    return content.slice(0, ai) + block + content.slice(ai);
  }

  const afterMarker = content.slice(idx + sectionMarker.length);
  const nextH2 = afterMarker.search(/\r?\n## /);
  const sectionEnd =
    nextH2 === -1 ? content.length : idx + sectionMarker.length + nextH2;
  const section = content.slice(idx, sectionEnd);
  const updated = insertIntoTaskTable(section, minor, newRow);
  if (updated == null) return null;
  return content.slice(0, idx) + updated + content.slice(sectionEnd);
}

/**
 * @returns {{ added: string[], skipped: string[] }}
 */
export function ensureMissingTodolistRows(root, prompt, ids, timeStr) {
  const added = [];
  const skipped = [];
  if (process.env.HARNESS_SKIP_TODOLIST_AUTO_ADD === "1") {
    for (const id of ids) skipped.push(`${id}(已禁用 HARNESS_SKIP_TODOLIST_AUTO_ADD)`);
    return { added, skipped };
  }

  const path = join(root, "AGENT_TODOLIST.md");
  if (!existsSync(path)) {
    for (const id of ids) skipped.push(`${id}(无 AGENT_TODOLIST.md)`);
    return { added, skipped };
  }

  const unique = [...new Set(ids)].sort((a, b) => {
    const [a1, a2] = a.split(".").map(Number);
    const [b1, b2] = b.split(".").map(Number);
    return a1 - b1 || a2 - b2;
  });

  let content = readFileSync(path, "utf8");

  for (const id of unique) {
    if (rowExistsForId(content, id)) continue;
    const parts = id.split(".");
    const major = Number(parts[0], 10);
    const minor = Number(parts[1], 10);
    if (major < 1 || major > 9 || minor < 1 || minor > 99) {
      skipped.push(`${id}(序号非法)`);
      continue;
    }

    let desc = extractDescriptionAfterTaskId(prompt, id);
    if (!desc) desc = `（新建 · ${timeStr}）`;
    desc = sanitizeTodolistDescription(desc);
    const newRow = `| [ ] | ${id} ${desc} | |`;

    const next = insertRowIntoMajorSection(content, major, minor, newRow);
    if (next == null) {
      skipped.push(`${id}(无法插入表格)`);
      continue;
    }
    content = next;
    added.push(id);
  }

  if (added.length) writeFileSync(path, content, "utf8");
  return { added, skipped };
}
