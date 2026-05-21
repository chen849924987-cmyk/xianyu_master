import {
  XF_LOW_GOODS_STEPS,
  type JobStepPhase,
  type JobStepPayload,
} from "@repo/src/features/xf-ali-find-low-goods/ui-pipeline";

import type { XfLowGoodsProgressFold } from "@/lib/parse-job-steps";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type NodeVisual = "pending" | "active" | "done" | "skipped" | "warn" | "error";

function phaseToVisual(phase: JobStepPhase | undefined): NodeVisual {
  switch (phase) {
    case "start":
    case "active":
      return "active";
    case "done":
      return "done";
    case "skipped":
      return "skipped";
    case "warn":
      return "warn";
    case "error":
      return "error";
    default:
      return "pending";
  }
}

function badgeForVisual(v: NodeVisual): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
  switch (v) {
    case "done":
      return "success";
    case "skipped":
      return "secondary";
    case "warn":
      return "warning";
    case "error":
      return "destructive";
    case "active":
      return "default";
    default:
      return "outline";
  }
}

function labelForVisual(v: NodeVisual): string {
  switch (v) {
    case "pending":
      return "待定";
    case "active":
      return "进行中";
    case "done":
      return "完成";
    case "skipped":
      return "跳过";
    case "warn":
      return "注意";
    case "error":
      return "失败";
    default:
      return "—";
  }
}

function formatMeta(meta: Record<string, unknown> | undefined): string {
  if (!meta || Object.keys(meta).length === 0) return "";
  try {
    return JSON.stringify(meta, null, 2);
  } catch {
    return String(meta);
  }
}

/** 避免仅剩布尔标记时整块 JSON 像「报错栈」 */
function shouldShowMeta(meta: Record<string, unknown> | undefined): boolean {
  if (!meta || Object.keys(meta).length === 0) return false;
  const keys = Object.keys(meta);
  if (keys.length === 1 && keys[0] === "navViaDouyin") return false;
  return true;
}

type Props = {
  fold: XfLowGoodsProgressFold;
  subtitle?: string;
};

export function XfLowGoodsProgress({ fold, subtitle }: Props) {
  const hasStructured = Object.keys(fold).length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">流程进度（低价好物）</CardTitle>
        <CardDescription>
          {subtitle ??
            "节点来自运行日志中的结构化标记；旧记录可能无节点，请以原始日志为准。"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasStructured ? (
          <p className="text-sm text-muted-foreground">
            暂无结构化进度事件。运行新版本功能后，此处将显示各步骤状态与关键参数。
          </p>
        ) : null}

        <ol className="relative space-y-0 border-l border-border pl-5">
          {XF_LOW_GOODS_STEPS.map((step, i) => {
            const ev: JobStepPayload | undefined = fold[step.id];
            const visual = phaseToVisual(ev?.phase);
            const isLast = i === XF_LOW_GOODS_STEPS.length - 1;

            return (
              <li key={step.id} className={isLast ? "pb-0" : "pb-6"}>
                <span
                  className={
                    "absolute -left-[5px] mt-1.5 size-2.5 rounded-full border border-background " +
                    (visual === "pending"
                      ? "bg-muted"
                      : visual === "active"
                        ? "animate-pulse bg-primary"
                        : visual === "done"
                          ? "bg-emerald-500"
                          : visual === "skipped"
                            ? "bg-slate-400"
                            : visual === "warn"
                              ? "bg-amber-500"
                              : "bg-destructive")
                  }
                  aria-hidden
                />
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{step.title}</span>
                      <Badge variant={badgeForVisual(visual)} className="tabular-nums">
                        {labelForVisual(visual)}
                      </Badge>
                      {ev?.phase ? (
                        <span className="font-mono text-[0.65rem] text-muted-foreground">{ev.phase}</span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {step.envHint ? (
                      <p className="text-xs text-muted-foreground/90">{step.envHint}</p>
                    ) : null}
                    {ev?.detail ? (
                      <p className="text-sm text-foreground/90">{ev.detail}</p>
                    ) : null}
                    {shouldShowMeta(ev?.meta) ? (
                      <pre className="mt-1 max-h-36 overflow-auto rounded-md bg-muted/50 p-2 font-mono text-[0.65rem] leading-snug text-muted-foreground">
                        {formatMeta(ev?.meta)}
                      </pre>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
