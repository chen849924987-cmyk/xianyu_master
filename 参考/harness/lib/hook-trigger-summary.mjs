/**
 * 从 Cursor hook stdin JSON 提取简短「触发来源」说明（用于 hook-usage 展示）。
 * 同时产出结构化 trigger_detail，便于控制台追溯「stdin → 摘要」链路。
 */
const MAX_LEN = 280;

function compact(s, max = MAX_LEN) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

/** @param {string} id */
function shortId(id) {
  const t = String(id || "").trim();
  if (!t) return "";
  if (t.length <= 14) return t;
  return `${t.slice(0, 8)}…`;
}

/** @param {unknown} roots */
function firstWorkspaceRootHint(roots) {
  if (!Array.isArray(roots) || roots.length === 0) return "";
  return compact(String(roots[0] || "").trim(), 140);
}

/** @param {unknown} input */
function toolInputHint(input) {
  if (!input || typeof input !== "object") return "";
  const o = /** @type {Record<string, unknown>} */ (input);
  if (typeof o.command === "string" && o.command.trim()) return compact(o.command, 240);
  const fp = o.file_path ?? o.path ?? o.target_file ?? o.file ?? o.uri;
  if (typeof fp === "string" && fp.trim()) return compact(fp, 240);
  const q = o.query ?? o.pattern ?? o.search ?? o.glob_pattern;
  if (typeof q === "string" && q.trim()) return compact(q, 240);
  for (const v of Object.values(o)) {
    if (typeof v === "string" && v.trim()) return compact(v, 240);
    if (Array.isArray(v) && v.length && typeof v[0] === "string") return compact(v[0], 240);
  }
  return "";
}

/**
 * @param {Record<string, unknown>} d
 * @param {string} eventArg
 */
function fallbackSummaryLine(d, eventArg) {
  const hookEvent = typeof d.hook_event_name === "string" ? d.hook_event_name.trim() : "";
  const cid = typeof d.conversation_id === "string" ? d.conversation_id.trim() : "";
  const sid = typeof d.session_id === "string" ? d.session_id.trim() : "";
  const id = cid || sid;
  const toolName = typeof d.tool_name === "string" ? d.tool_name.trim() : "";
  const parts = [];
  if (hookEvent) parts.push(hookEvent);
  else parts.push(`Hook 事件 ${eventArg}`);
  if (id) parts.push(`会话 ${shortId(id)}`);
  if (toolName) parts.push(`工具 ${toolName}`);
  if (!parts.length) {
    const keys = Object.keys(d).slice(0, 6).join(", ");
    return keys ? `stdin 字段示例: ${keys}` : "—";
  }
  return parts.join(" · ");
}

/**
 * @param {Record<string, unknown>} d
 */
function fallbackFacets(d) {
  /** @type {Record<string, string>} */
  const facets = {};
  const copyKeys = [
    "hook_event_name",
    "conversation_id",
    "session_id",
    "generation_id",
    "model",
    "composer_mode",
    "cursor_version",
    "tool_name",
    "toolName",
  ];
  for (const k of copyKeys) {
    const v = d[k];
    if (typeof v === "string" && v.trim()) facets[k] = compact(v, 220);
  }
  if (typeof d.is_background_agent === "boolean") facets.is_background_agent = d.is_background_agent ? "true" : "false";
  const ws = firstWorkspaceRootHint(d.workspace_roots);
  if (ws) facets.workspace_root = ws;
  return facets;
}

/** 去掉 BOM、丢弃 `{` 前的噪声，减轻 JSON.parse 失败率 */
function normalizeStdinJsonCandidate(raw) {
  let t = String(raw || "").trim();
  if (t.charCodeAt(0) === 0xfeff) t = t.slice(1).trim();
  const i = t.indexOf("{");
  if (i > 0) t = t.slice(i);
  return t;
}

/** @param {string} s */
/** @param {string} key */
function looseSimpleString(s, key) {
  const re = new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, "m");
  const m = s.match(re);
  return m && m[1] !== undefined ? m[1] : null;
}

/** @param {string} s */
/** @param {string} key */
function looseNumberField(s, key) {
  const re = new RegExp(`"${key}"\\s*:\\s*(-?\\d+)`, "m");
  const m = s.match(re);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** @param {string} s */
function looseBoolField(s, key) {
  const re = new RegExp(`"${key}"\\s*:\\s*(true|false)`, "m");
  const m = s.match(re);
  if (!m) return null;
  return m[1] === "true";
}

/** 仅取 workspace_roots 数组首项（路径里一般无未转义引号） */
function looseFirstWorkspaceRoot(s) {
  const m = s.match(/"workspace_roots"\s*:\s*\[\s*"([^"]*)"/m);
  return m ? m[1] : null;
}

/**
 * JSON.parse 失败时（常见于 Cursor 传入的 stdin 被截断），用正则提取顶层标量字段。
 * @param {string} stdinStr
 * @returns {Record<string, unknown>}
 */
export function extractStdinFieldsLoose(stdinStr) {
  const s = normalizeStdinJsonCandidate(stdinStr);
  /** @type {Record<string, unknown>} */
  const o = {};

  const strKeysSimple = [
    "conversation_id",
    "session_id",
    "generation_id",
    "model",
    "status",
    "composer_mode",
    "cursor_version",
    "hook_event_name",
    "tool_name",
    "toolName",
    "failure_type",
  ];
  for (const k of strKeysSimple) {
    const v = looseSimpleString(s, k);
    if (v != null && String(v).trim() !== "") o[k] = v;
  }

  const numKeys = ["loop_count", "input_tokens", "output_tokens", "cache_read_tokens", "cache_write_tokens"];
  for (const k of numKeys) {
    const n = looseNumberField(s, k);
    if (n != null) o[k] = n;
  }

  const bg = looseBoolField(s, "is_background_agent");
  if (bg !== null) o.is_background_agent = bg;

  const wr = looseFirstWorkspaceRoot(s);
  if (wr) o.workspace_roots = [wr];

  return o;
}

/**
 * @typedef {{ summary: string, detail?: Record<string, unknown> }} HookTriggerRecord
 */

/**
 * @param {string} event
 * @param {Record<string, unknown>} d
 * @returns {HookTriggerRecord}
 */
function composeTriggerRecord(event, d) {
  /** @type {string} */
  let line;
  /** @type {Record<string, unknown> | undefined} */
  let detail;

  switch (event) {
    case "beforeSubmitPrompt": {
      const p = d.prompt;
      if (typeof p === "string" && p.trim()) line = `提示词: ${p}`;
      else line = "提示词: (空)";
      detail = {
        origin: "cursor_hook_stdin",
        pipeline: "Cursor → hook stdin → run-hook.mjs → hook-trigger-summary.mjs",
        stdin_top_keys: Object.keys(d).slice(0, 14),
        facets:
          typeof p === "string"
            ? { prompt_chars: String(p.length) }
            : { prompt_chars: "0" },
      };
      break;
    }
    case "afterAgentResponse": {
      const t = d.text;
      if (typeof t === "string" && t.trim()) line = `助手: ${t}`;
      else line = "助手回复";
      detail = {
        origin: "cursor_hook_stdin",
        pipeline: "Cursor → hook stdin → run-hook.mjs → hook-trigger-summary.mjs",
        stdin_top_keys: Object.keys(d).slice(0, 14),
        facets:
          typeof t === "string"
            ? { reply_chars: String(t.length) }
            : { reply_chars: "0" },
      };
      break;
    }
    case "beforeShellExecution": {
      const c = d.command;
      if (typeof c === "string" && c.trim()) line = `终端 Shell: ${c}`;
      else line = "终端 Shell";
      detail = {
        origin: "cursor_hook_stdin",
        pipeline: "Cursor → hook stdin → run-hook.mjs → hook-trigger-summary.mjs",
        stdin_top_keys: Object.keys(d).slice(0, 14),
        facets: typeof c === "string" && c.trim() ? { command: compact(c, 260) } : {},
      };
      break;
    }
    case "preToolUse":
    case "postToolUse": {
      const toolName = String(d.tool_name ?? d.toolName ?? "tool").trim() || "tool";
      const input = d.tool_input ?? d.toolInput;
      const hint = toolInputHint(input);
      line = hint ? `${toolName}: ${hint}` : toolName;
      detail = {
        origin: "cursor_hook_stdin",
        pipeline: "Cursor → hook stdin → run-hook.mjs → hook-trigger-summary.mjs",
        stdin_top_keys: Object.keys(d).slice(0, 14),
        facets: {
          tool_name: toolName,
          ...(hint ? { input_hint: compact(hint, 260) } : {}),
        },
      };
      break;
    }
    case "postToolUseFailure": {
      const toolName = String(d.tool_name ?? d.toolName ?? "tool").trim() || "tool";
      const input = d.tool_input ?? d.toolInput;
      const hint = toolInputHint(input);
      const err = d.error_message ?? d.failure_type;
      const errS = typeof err === "string" && err.trim() ? compact(err, 200) : "";
      if (hint && errS) line = `${toolName} 失败 · ${hint} · ${errS}`;
      else if (errS) line = `${toolName} 失败: ${errS}`;
      else if (hint) line = `${toolName} 失败 · ${hint}`;
      else line = `${toolName} 失败`;
      detail = {
        origin: "cursor_hook_stdin",
        pipeline: "Cursor → hook stdin → run-hook.mjs → hook-trigger-summary.mjs",
        stdin_top_keys: Object.keys(d).slice(0, 14),
        facets: {
          tool_name: toolName,
          ...(hint ? { input_hint: compact(hint, 260) } : {}),
          ...(errS ? { error: errS } : {}),
        },
      };
      break;
    }
    case "afterFileEdit": {
      const fp = d.file_path;
      if (typeof fp === "string" && fp.trim()) line = `保存: ${fp}`;
      else line = "保存文件";
      detail = {
        origin: "cursor_hook_stdin",
        pipeline: "Cursor → hook stdin → run-hook.mjs → hook-trigger-summary.mjs",
        stdin_top_keys: Object.keys(d).slice(0, 14),
        facets: typeof fp === "string" && fp.trim() ? { file_path: compact(fp, 260) } : {},
      };
      break;
    }
    case "sessionStart": {
      const cid = typeof d.conversation_id === "string" ? d.conversation_id.trim() : "";
      const sid = typeof d.session_id === "string" ? d.session_id.trim() : "";
      const id = cid || sid;
      const model = typeof d.model === "string" ? d.model.trim() : "";
      const mode = typeof d.composer_mode === "string" ? d.composer_mode.trim() : "";
      const cv = typeof d.cursor_version === "string" ? d.cursor_version.trim() : "";
      const gen = typeof d.generation_id === "string" ? d.generation_id.trim() : "";
      const ws = firstWorkspaceRootHint(d.workspace_roots);
      let visibility = "";
      if (d.is_background_agent === true) visibility = "后台 Agent";
      else if (d.is_background_agent === false) visibility = "前台 Agent";

      const parts = ["会话开始"];
      if (mode) parts.push(mode);
      if (model) parts.push(model === "default" ? "model 默认" : `model ${model}`);
      if (id) parts.push(`会话 ${shortId(id)}`);
      if (visibility) parts.push(visibility);
      if (cv) parts.push(`Cursor ${cv}`);
      line = parts.join(" · ");

      /** @type {Record<string, string>} */
      const facets = {};
      if (cid) facets.conversation_id = cid;
      if (sid && sid !== cid) facets.session_id = sid;
      if (model) facets.model = model;
      if (mode) facets.composer_mode = mode;
      if (cv) facets.cursor_version = cv;
      if (gen) facets.generation_id = gen;
      if (visibility) facets.agent_visibility = visibility;
      if (ws) facets.workspace_root = ws;

      detail = {
        origin: "cursor_hook_stdin",
        pipeline: "Cursor → hook stdin → run-hook.mjs → hook-trigger-summary.mjs",
        stdin_top_keys: Object.keys(d).slice(0, 18),
        facets,
      };
      break;
    }
    case "stop": {
      const st = d.status != null ? String(d.status) : "?";
      const lc = d.loop_count != null ? ` · loop ${d.loop_count}` : "";
      line = `Agent 结束: ${st}${lc}`;
      /** @type {Record<string, string>} */
      const stopFacets = {
        status: String(st),
        ...(d.loop_count != null ? { loop_count: String(d.loop_count) } : {}),
      };
      const cid = typeof d.conversation_id === "string" ? d.conversation_id.trim() : "";
      const sid = typeof d.session_id === "string" ? d.session_id.trim() : "";
      const model = typeof d.model === "string" ? d.model.trim() : "";
      const cv = typeof d.cursor_version === "string" ? d.cursor_version.trim() : "";
      const gen = typeof d.generation_id === "string" ? d.generation_id.trim() : "";
      if (cid) stopFacets.conversation_id = cid;
      if (sid && sid !== cid) stopFacets.session_id = sid;
      if (model) stopFacets.model = model;
      if (cv) stopFacets.cursor_version = cv;
      if (gen) stopFacets.generation_id = gen;
      for (const tk of ["input_tokens", "output_tokens", "cache_read_tokens", "cache_write_tokens"]) {
        const n = d[tk];
        if (typeof n === "number" && Number.isFinite(n)) stopFacets[tk] = String(n);
      }
      detail = {
        origin: "cursor_hook_stdin",
        pipeline: "Cursor → hook stdin → run-hook.mjs → hook-trigger-summary.mjs",
        stdin_top_keys: Object.keys(d).slice(0, 14),
        facets: stopFacets,
      };
      break;
    }
    default:
      line = fallbackSummaryLine(d, event);
      detail = {
        origin: "cursor_hook_stdin",
        pipeline: "Cursor → hook stdin → run-hook.mjs → hook-trigger-summary.mjs",
        hook_event_arg: event,
        stdin_top_keys: Object.keys(d).slice(0, 18),
        facets: fallbackFacets(d),
      };
  }

  const record = /** @type {HookTriggerRecord} */ ({ summary: compact(line) });
  if (detail && typeof detail === "object") record.detail = detail;
  return record;
}

/**
 * @param {string} event - Cursor 事件名（与 hooks.json / argv 一致）
 * @param {string} stdinStr - 原始 stdin
 * @returns {HookTriggerRecord}
 */
export function buildHookTriggerRecord(event, stdinStr) {
  if (!stdinStr || !String(stdinStr).trim()) {
    return { summary: "—" };
  }

  const candidate = normalizeStdinJsonCandidate(stdinStr);
  let data = null;
  try {
    data = JSON.parse(candidate);
  } catch {
    data = null;
  }

  if (data && typeof data === "object" && !Array.isArray(data)) {
    return composeTriggerRecord(event, /** @type {Record<string, unknown>} */ (data));
  }

  const loose = extractStdinFieldsLoose(stdinStr);
  if (Object.keys(loose).length > 0) {
    const rec = composeTriggerRecord(event, loose);
    const baseDetail = rec.detail && typeof rec.detail === "object" ? rec.detail : {};
    const baseFacets =
      baseDetail.facets && typeof baseDetail.facets === "object"
        ? /** @type {Record<string, string>} */ (baseDetail.facets)
        : {};
    rec.detail = {
      ...baseDetail,
      facets: {
        ...baseFacets,
        stdin_parse: "regex_fallback_truncated_stdin",
      },
      stdin_preview: compact(candidate, 480),
      parse_note:
        "JSON.parse 未成功（stdin 可能被 Cursor 截断或含非法转义）；下列字段由正则从片段中提取",
    };
    return rec;
  }

  return {
    summary: compact(`stdin 无法解析为 JSON：${compact(candidate, 200)}`),
    detail: {
      origin: "cursor_hook_stdin",
      pipeline: "Cursor → hook stdin → run-hook.mjs → hook-trigger-summary.mjs",
      facets: { parse_error: "invalid_json" },
      stdin_preview: compact(candidate, 480),
    },
  };
}

/**
 * @param {string} event
 * @param {string} stdinStr
 * @returns {string}
 */
export function summarizeHookTrigger(event, stdinStr) {
  return buildHookTriggerRecord(event, stdinStr).summary;
}
