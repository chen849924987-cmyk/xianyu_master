import { Fragment, useCallback, useEffect, useState } from "react";

import { fetchHookUsage } from "@/api/client";
import type { HookAgg, HookRunRow, HookTriggerDetail } from "@/api/types";
import { formatAsiaShanghai } from "@/lib/format-time";
import { getHookScriptDescription } from "@/lib/hook-script-description";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/** 与 harness/lib/hook-usage-tracker.mjs 中 MAX_RUNS 一致：本地最多保留 300 条原始调用 */
const RECENT_RUNS_LIMIT = 300;

/** 按时间新→旧排序后取前 limit 条；eventFilter 为空表示全部事件 */
function pickRecentRuns(runs: HookRunRow[], eventFilter: string, limit: number): HookRunRow[] {
  const byTimeDesc = [...runs].sort((a, b) => {
    const tb = Date.parse(b.at);
    const ta = Date.parse(a.at);
    if (Number.isNaN(tb) && Number.isNaN(ta)) return 0;
    if (Number.isNaN(tb)) return -1;
    if (Number.isNaN(ta)) return 1;
    return tb - ta;
  });
  const subset = eventFilter === "" ? byTimeDesc : byTimeDesc.filter((r) => r.event === eventFilter);
  return subset.slice(0, limit);
}

const HOOK_EVENT_COLORS = [
  "#2563eb",
  "#16a34a",
  "#ca8a04",
  "#dc2626",
  "#9333ea",
  "#0891b2",
  "#ea580c",
  "#db2777",
];

function sumInvocationsByEvent(aggregates: Record<string, HookAgg>): Map<string, number> {
  const m = new Map<string, number>();
  for (const a of Object.values(aggregates)) {
    m.set(a.event, (m.get(a.event) ?? 0) + a.invocations);
  }
  return m;
}

function TriggerSourceDetails({ detail }: { detail: HookTriggerDetail }) {
  const keys = detail.stdin_top_keys?.filter(Boolean).join(", ");
  const facets = detail.facets && typeof detail.facets === "object" ? detail.facets : null;
  const facetEntries = facets ? Object.entries(facets).filter(([, v]) => v != null && String(v).trim() !== "") : [];

  return (
    <div className="space-y-2 border-t border-border/60 pt-2 text-[0.65rem] leading-snug text-muted-foreground">
      {detail.pipeline ? <p className="text-foreground/80">{detail.pipeline}</p> : null}
      {detail.parse_note ? <p className="text-amber-800 dark:text-amber-200/90">{detail.parse_note}</p> : null}
      {detail.origin ? (
        <p>
          <span className="font-medium text-foreground/90">载荷来源</span>：<code className="rounded bg-muted px-1">{detail.origin}</code>
        </p>
      ) : null}
      {detail.hook_event_arg ? (
        <p>
          <span className="font-medium text-foreground/90">run-hook 事件参数</span>：<code className="rounded bg-muted px-1">{detail.hook_event_arg}</code>
        </p>
      ) : null}
      {keys ? (
        <p>
          <span className="font-medium text-foreground/90">stdin 顶层键</span>：{keys}
        </p>
      ) : null}
      {facetEntries.length > 0 ? (
        <dl className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]">
          {facetEntries.map(([k, v]) => (
            <Fragment key={k}>
              <dt className="font-mono text-[0.62rem] text-foreground/85">{k}</dt>
              <dd className="min-w-0 break-all font-mono text-[0.62rem]">{String(v)}</dd>
            </Fragment>
          ))}
        </dl>
      ) : null}
      {detail.stdin_preview ? (
        <p className="break-all font-mono text-[0.62rem]">
          <span className="font-medium text-foreground/90">stdin 片段</span>：{detail.stdin_preview}
        </p>
      ) : null}
      {detail.note ? <p className="italic">{detail.note}</p> : null}
    </div>
  );
}

function conicByEvent(byEvent: Map<string, number>): string {
  const total = [...byEvent.values()].reduce((s, n) => s + n, 0);
  if (total <= 0) return "#e2e8f0";
  const sorted = [...byEvent.entries()].sort((a, b) => b[1] - a[1]);
  let acc = 0;
  const parts: string[] = [];
  sorted.forEach(([evt, count], i) => {
    const start = (acc / total) * 100;
    acc += count;
    const end = (acc / total) * 100;
    parts.push(`${HOOK_EVENT_COLORS[i % HOOK_EVENT_COLORS.length]} ${start}% ${end}%`);
  });
  return `conic-gradient(${parts.join(", ")})`;
}

export function HookUsageCharts() {
  const [data, setData] = useState<{ aggregates: Record<string, HookAgg>; runs: HookRunRow[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  /** 空字符串 = 全部事件；每种视图至多 RECENT_RUNS_LIMIT 条（按时间新在上） */
  const [recentEventFilter, setRecentEventFilter] = useState("");

  const load = useCallback(async () => {
    const result = await fetchHookUsage();
    if (!result.ok) {
      setErr(result.error);
      return;
    }
    setErr(null);
    setData({ aggregates: result.aggregates, runs: result.runs });
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!data || recentEventFilter === "") return;
    const exists = data.runs.some((r) => r.event === recentEventFilter);
    if (!exists) setRecentEventFilter("");
  }, [data, recentEventFilter]);

  if (err) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-destructive">无法加载 hook 统计</CardTitle>
          <CardDescription className="text-destructive/90">{err}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          若 API 已正常：再确认已启用 <code className="rounded bg-muted px-1 py-0.5">run-hook.mjs</code>，且仓库根目录存在{" "}
          <code className="rounded bg-muted px-1 py-0.5">.data/hook-usage.json</code>。
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <span className="size-4 animate-pulse rounded-full bg-primary/40" />
        加载 hook 统计…
      </div>
    );
  }

  const rows = Object.values(data.aggregates).sort((a, b) => b.invocations - a.invocations);
  const maxInv = Math.max(1, ...rows.map((r) => r.invocations));
  const byEvent = sumInvocationsByEvent(data.aggregates);
  const totalCalls = [...byEvent.values()].reduce((s, n) => s + n, 0);
  const sortedEvents = [...byEvent.entries()].sort((a, b) => b[1] - a[1]);
  const recentEventOptions = [...new Set(data.runs.map((r) => r.event))].sort((a, b) => a.localeCompare(b));
  const recent = pickRecentRuns(data.runs, recentEventFilter, RECENT_RUNS_LIMIT);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={() => void load()}>
          刷新统计
        </Button>
        <p className="text-xs text-muted-foreground">
          约每 8 秒自动刷新 · 数据来自 <code className="rounded bg-muted px-1 py-0.5">.data/hook-usage.json</code>
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          尚无 hook 调用记录。在 Cursor 里触发几次 Agent / 保存文件后即可在此查看。
        </p>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:items-start">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">按 Cursor 事件</CardTitle>
                <CardDescription>调用次数占比</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative size-44">
                  <div
                    className="size-full rounded-full shadow-inner ring-1 ring-black/5"
                    style={{ background: conicByEvent(byEvent) }}
                  />
                  <div className="absolute inset-[26%] flex flex-col items-center justify-center rounded-full bg-card text-center shadow-sm ring-1 ring-black/5">
                    <span className="text-xl font-bold tabular-nums text-foreground">{totalCalls}</span>
                    <span className="text-[0.65rem] text-muted-foreground">次调用</span>
                  </div>
                </div>
                <div className="mt-4 flex max-w-full flex-wrap justify-center gap-x-3 gap-y-1.5 text-xs">
                  {sortedEvents.map(([evt, n], i) => (
                    <span key={evt} className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <span
                        className="size-2 shrink-0 rounded-sm"
                        style={{ background: HOOK_EVENT_COLORS[i % HOOK_EVENT_COLORS.length] }}
                      />
                      <span className="font-medium text-foreground">{evt}</span>({n})
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">各 Hook 脚本</CardTitle>
                <CardDescription>条宽 = 相对调用量；绿 = 成功占比 / 红 = 失败占比</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {rows.map((a) => {
                  const inv = a.invocations;
                  const fail = Math.min(a.failures, inv);
                  const ok = Math.max(0, inv - fail);
                  const widthPct = (inv / maxInv) * 100;
                  const avgMs = inv ? Math.round(a.total_duration_ms / inv) : 0;
                  return (
                    <div key={`${a.event}-${a.script}`} className="space-y-1.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                        <span className="min-w-0 flex-1 space-y-0.5">
                          <span>
                            <span className="font-semibold text-foreground">{a.event}</span>{" "}
                            <code className="rounded bg-muted px-1 py-px text-[0.7rem]">{a.script}</code>
                          </span>
                          <span className="block text-[0.65rem] leading-snug text-muted-foreground">
                            {getHookScriptDescription(a.script)}
                          </span>
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {inv} 次 · 失败 {fail} · 平均 {avgMs} ms
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div className="flex h-full rounded-full transition-[width]" style={{ width: `${widthPct}%` }}>
                          {fail > 0 ? (
                            <>
                              <div className="min-w-0 bg-gradient-to-b from-emerald-400 to-emerald-600" style={{ flex: ok || 1 }} />
                              <div className="min-w-0 bg-gradient-to-b from-red-400 to-red-600" style={{ flex: fail }} />
                            </>
                          ) : (
                            <div className="min-w-0 flex-1 bg-gradient-to-b from-emerald-400 to-emerald-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {data.runs.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <h3 className="text-sm font-semibold text-foreground">最近调用</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="shrink-0">按事件筛选</span>
                      <select
                        className="h-9 max-w-[min(100%,280px)] rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={recentEventFilter}
                        onChange={(e) => setRecentEventFilter(e.target.value)}
                        aria-label="按 Cursor 事件筛选最近调用"
                      >
                        <option value="">全部事件</option>
                        {recentEventOptions.map((evt) => (
                          <option key={evt} value={evt}>
                            {evt}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="text-xs text-muted-foreground">
                      当前视图至多 {RECENT_RUNS_LIMIT} 条，新在上
                      {recentEventFilter ? ` · 已选「${recentEventFilter}」` : " · 全部事件混合"}
                    </p>
                  </div>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  「触发」列为 Cursor 调用 hook 时通过{" "}
                  <span className="font-medium text-foreground/85">stdin JSON</span> 经{" "}
                  <code className="rounded bg-muted px-1 py-0.5">hook-trigger-summary.mjs</code> 生成的单行摘要。展开「追溯来源」可查看载荷字段与数据链路；旧记录在升级前可能仅有「—」且无结构化详情。
                </p>
                {recent.length === 0 ? (
                  <p className="rounded-md border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                    该筛选下暂无记录（可能当前保留的 {RECENT_RUNS_LIMIT} 条内没有此事件）。
                  </p>
                ) : (
                  <div className="max-h-[min(70vh,720px)] overflow-auto rounded-md border">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-background shadow-[inset_0_-1px_0_0_hsl(var(--border))]">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-36">时间 (UTC+8)</TableHead>
                          <TableHead>事件</TableHead>
                          <TableHead className="min-w-[12rem] max-w-md">触发</TableHead>
                          <TableHead className="min-w-[12rem] max-w-[28rem]">脚本</TableHead>
                          <TableHead className="min-w-[14rem] max-w-xl">说明</TableHead>
                          <TableHead className="text-right">ms</TableHead>
                          <TableHead className="text-right">退出码</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recent.map((r, i) => (
                          <TableRow key={`${r.at}-${r.event}-${r.script}-${i}`}>
                            <TableCell className="font-mono text-xs whitespace-nowrap" title={r.at}>
                              {formatAsiaShanghai(r.at)}
                            </TableCell>
                            <TableCell className="text-xs">{r.event}</TableCell>
                            <TableCell className="max-w-md text-xs leading-snug text-muted-foreground">
                              <div className="space-y-1">
                                <p title={r.trigger_summary?.trim() || undefined}>
                                  {r.trigger_summary?.trim() ? r.trigger_summary : "—"}
                                </p>
                                {r.trigger_detail && typeof r.trigger_detail === "object" ? (
                                  <details className="rounded border border-border/70 bg-muted/20 px-2 py-1">
                                    <summary className="cursor-pointer select-none text-[0.65rem] font-medium text-primary">
                                      追溯来源
                                    </summary>
                                    <TriggerSourceDetails detail={r.trigger_detail} />
                                  </details>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              <code>{r.script}</code>
                            </TableCell>
                            <TableCell className="max-w-xl text-xs leading-snug text-muted-foreground">
                              {getHookScriptDescription(r.script)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-xs">{r.duration_ms}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={r.exit_code === 0 ? "success" : "destructive"} className="tabular-nums">
                                {r.exit_code}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
