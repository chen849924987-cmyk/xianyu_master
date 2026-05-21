import {
  JOB_STEP_ANCHOR,
  XF_LOW_GOODS_UI_FEATURE_ID,
  type JobStepPayload,
  type XfLowGoodsStepId,
} from "@repo/src/features/xf-ali-find-low-goods/ui-pipeline";

export type XfLowGoodsProgressFold = Partial<Record<XfLowGoodsStepId, JobStepPayload>>;

export function tryParseJobStepLine(line: string): JobStepPayload | null {
  const idx = line.indexOf(JOB_STEP_ANCHOR);
  if (idx === -1) return null;
  const jsonPart = line.slice(idx + JOB_STEP_ANCHOR.length).trim();
  if (!jsonPart) return null;
  try {
    const o = JSON.parse(jsonPart) as JobStepPayload;
    if (o.featureId !== XF_LOW_GOODS_UI_FEATURE_ID || typeof o.stepId !== "string" || typeof o.phase !== "string") {
      return null;
    }
    return o;
  } catch {
    return null;
  }
}

/** 解析完整日志（历史回放 / 全量重算） */
export function parseJobStepLines(fullText: string): JobStepPayload[] {
  const lines = fullText.split(/\r?\n/);
  const out: JobStepPayload[] = [];
  for (const raw of lines) {
    const p = tryParseJobStepLine(raw.replace(/\r$/, ""));
    if (p) out.push(p);
  }
  return out;
}

export function foldJobStepEvents(events: JobStepPayload[]): XfLowGoodsProgressFold {
  const fold: XfLowGoodsProgressFold = {};
  for (const e of events) {
    fold[e.stepId] = e;
  }
  return fold;
}

export function parseLogToFold(log: string): XfLowGoodsProgressFold {
  return foldJobStepEvents(parseJobStepLines(log));
}

export function mergeProgressFold(prev: XfLowGoodsProgressFold, events: JobStepPayload[]): XfLowGoodsProgressFold {
  if (events.length === 0) return prev;
  const next = { ...prev };
  for (const e of events) {
    next[e.stepId] = e;
  }
  return next;
}

/** SSE 按块追加时的行缓冲，避免半行 JSON */
export function createJobStepLineParser(): {
  reset: () => void;
  push: (chunk: string) => JobStepPayload[];
  flush: () => JobStepPayload[];
} {
  let buf = "";
  return {
    reset() {
      buf = "";
    },
    push(chunk: string): JobStepPayload[] {
      buf += chunk;
      const parts = buf.split("\n");
      buf = parts.pop() ?? "";
      const found: JobStepPayload[] = [];
      for (const line of parts) {
        const p = tryParseJobStepLine(line.replace(/\r$/, ""));
        if (p) found.push(p);
      }
      return found;
    },
    flush(): JobStepPayload[] {
      const line = buf.replace(/\r$/, "");
      buf = "";
      const p = tryParseJobStepLine(line);
      return p ? [p] : [];
    },
  };
}
