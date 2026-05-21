import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// 7 种推理框架（不是人设）。输出给 followup_message 使用。
export const REASONING_MODES = [
  {
    id: "root_cause",
    name: "根因分析",
    when: "修 bug、查事故",
    method: "5-Why + 扫同类 bug",
  },
  {
    id: "first_principles",
    name: "第一性原理",
    when: "干净新建功能",
    method: "质疑→删除→简化→加速→自动化",
  },
  {
    id: "subtraction",
    name: "减法",
    when: "重构、清理",
    method: "删除优先，不增加新抽象",
  },
  {
    id: "search_first",
    name: "搜索优先",
    when: "根因未知",
    method: "先查历史/文档，再判断",
  },
  {
    id: "working_backwards",
    name: "Working Backwards",
    when: "新模块设计",
    method: "倒推用户终态 + 写 PR 稿",
  },
  {
    id: "evidence_driven",
    name: "证据驱动",
    when: "性能/质量测量",
    method: "用数据替代直觉",
  },
  {
    id: "closed_loop",
    name: "闭环",
    when: "默认（部署/运维/其他）",
    method: "定目标、追过程、拿结果",
  },
];

const STATE_FILE = "harness-cognitive.json";

function statePath(root) {
  return join(root, ".data", STATE_FILE);
}

function nowMs() {
  return Date.now();
}

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export function isAutoModeSwitchEnabled() {
  return process.env.HARNESS_AUTO_MODE_SWITCH === "1";
}

export function frustrationWindowMs() {
  return Number(process.env.HARNESS_FRUSTRATION_WINDOW_MS || 20 * 60_000);
}

export function frustrationMinHits() {
  return Number(process.env.HARNESS_FRUSTRATION_MIN_HITS || 2);
}

export function maxAutoFollowups() {
  return Number(process.env.HARNESS_FRUSTRATION_MAX_FOLLOWUPS || 1);
}

export function loadCognitiveState(root) {
  const p = statePath(root);
  if (!existsSync(p)) {
    return {
      frustration_hits: 0,
      first_hit_at: 0,
      last_hit_at: 0,
      last_user_prompt: "",
      followups_issued_in_window: 0,
      last_mode_id: null,
      last_mode_at: 0,
    };
  }
  const j = safeJsonParse(readFileSync(p, "utf8"));
  return (
    j || {
      frustration_hits: 0,
      first_hit_at: 0,
      last_hit_at: 0,
      last_user_prompt: "",
      followups_issued_in_window: 0,
      last_mode_id: null,
      last_mode_at: 0,
    }
  );
}

export function saveCognitiveState(root, state) {
  const dir = join(root, ".data");
  mkdirSync(dir, { recursive: true });
  writeFileSync(statePath(root), `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function looksLikeFrustration(text) {
  const t = String(text || "").trim();
  if (!t) return false;
  const lower = t.toLowerCase();

  // 中文挫败信号（偏“我卡住了/又不对/反复试”）
  const cn = [
    "不对",
    "还是不对",
    "又不对",
    "不行",
    "不可以",
    "失败",
    "报错",
    "又报错",
    "怎么还是",
    "怎么还",
    "卡住",
    "纠结",
    "重来",
    "再试",
    "还是不行",
    "一直",
    "总是",
  ];
  if (cn.some((k) => t.includes(k))) return true;

  // 英文常见挫败信号
  const en = ["still", "again", "doesn't work", "not working", "error", "failed", "stuck", "nope"];
  if (en.some((k) => lower.includes(k))) return true;

  return false;
}

function pickModeHeuristic(lastUserPrompt) {
  const t = String(lastUserPrompt || "");
  const lower = t.toLowerCase();
  if (/(性能|慢|耗时|profile|benchmark|latency|throughput)/i.test(t)) return "evidence_driven";
  if (/(bug|报错|error|exception|stack|trace|崩溃)/i.test(lower)) return "root_cause";
  if (/(重构|clean|cleanup|refactor|删除|简化)/i.test(lower)) return "subtraction";
  if (/(设计|方案|架构|模块|new feature|feature|spec|需求)/i.test(lower)) return "working_backwards";
  if (/(文档|历史|之前|决策|why|原因|背景|谁改的|git blame|log)/i.test(lower)) return "search_first";
  return "closed_loop";
}

function modeById(id) {
  return REASONING_MODES.find((m) => m.id === id) || REASONING_MODES[REASONING_MODES.length - 1];
}

/** beforeSubmitPrompt：记录挫败信号（不改变 prompt，只写 state） */
export function recordUserPromptSignal(root, prompt) {
  if (!isAutoModeSwitchEnabled()) return;
  if (!looksLikeFrustration(prompt)) return;

  const win = frustrationWindowMs();
  const st = loadCognitiveState(root);
  const now = nowMs();

  const windowOk = st.first_hit_at && now - st.first_hit_at <= win;
  const base = windowOk
    ? st
    : {
        frustration_hits: 0,
        first_hit_at: 0,
        last_hit_at: 0,
        last_user_prompt: "",
        followups_issued_in_window: 0,
        last_mode_id: st.last_mode_id || null,
        last_mode_at: st.last_mode_at || 0,
      };

  base.frustration_hits += 1;
  base.first_hit_at = base.first_hit_at || now;
  base.last_hit_at = now;
  base.last_user_prompt = String(prompt || "").slice(0, 2000);
  saveCognitiveState(root, base);
}

/**
 * stop：是否发 followup_message 触发自动切换
 * - 只在 status=completed 时考虑（避免 error/aborted 乱循环）
 */
export function buildAutoModeSwitchFollowup(root, { status }) {
  if (!isAutoModeSwitchEnabled()) return null;
  if (String(status) !== "completed") return null;

  const st = loadCognitiveState(root);
  const win = frustrationWindowMs();
  const now = nowMs();

  if (!st.first_hit_at || now - st.first_hit_at > win) return null;
  if (st.frustration_hits < frustrationMinHits()) return null;
  if ((st.followups_issued_in_window || 0) >= maxAutoFollowups()) return null;

  const nextModeId = pickModeHeuristic(st.last_user_prompt);
  const m = modeById(nextModeId);

  // 标记已发 followup，避免 stop 反复触发
  st.followups_issued_in_window = (st.followups_issued_in_window || 0) + 1;
  st.last_mode_id = nextModeId;
  st.last_mode_at = now;
  saveCognitiveState(root, st);

  const table = REASONING_MODES.map(
    (x) => `- ${x.name}：${x.when}（${x.method}）`,
  ).join("\n");

  return [
    "检测到用户在同一问题上多次挫败/反复尝试。标记当前方案为已失败，切换推理框架重试。",
    "",
    `我将切换到「${m.name}」模式，因为原模式在当前反馈下没有收敛到可验证结果。`,
    "",
    "请按以下流程执行：",
    "- 先用 3-6 条 bullet 总结：已确认的事实、失败路径、当前假设（不超过 120 字）。",
    "- 明确本轮的可验证目标（1 条），并给出最小化实验步骤（<=3 步）。",
    `- 采用「${m.name}」方法：${m.method}。`,
    "",
    "可选推理模式表（供你切换对照）：",
    table,
  ].join("\n");
}

