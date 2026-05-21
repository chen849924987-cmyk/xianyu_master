import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import {
  fetchFeatureRunDetail,
  fetchFeatureRuns,
  fetchFeatures,
  fetchSession,
  postJobReportError,
  postRunJob,
  postSaveSessionConfirm,
  postSaveSessionJob,
} from "@/api/client";
import type { FeatureJobRunDetail, FeatureJobRunSummary, FeatureRow } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { XfLowGoodsProgress } from "@/components/features/XfLowGoodsProgress";
import { SAVE_SESSION_FEATURE_ID, XF_LOW_GOODS_FEATURE_ID } from "@/lib/feature-routes";
import { formatAsiaShanghai } from "@/lib/format-time";
import { subscribeJobLogs } from "@/lib/job-log-stream";
import { createJobStepLineParser, mergeProgressFold, parseLogToFold, type XfLowGoodsProgressFold } from "@/lib/parse-job-steps";

export function FeatureDetailPage() {
  const { featureId = "" } = useParams<{ featureId: string }>();
  const isSaveSession = featureId === SAVE_SESSION_FEATURE_ID;
  const isXfLowGoods = featureId === XF_LOW_GOODS_FEATURE_ID;

  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [featuresLoaded, setFeaturesLoaded] = useState(false);
  const [headed, setHeaded] = useState(true);
  const [logText, setLogText] = useState("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [saveJobId, setSaveJobId] = useState<string | null>(null);
  const [runs, setRuns] = useState<FeatureJobRunSummary[]>([]);
  const [runsErr, setRunsErr] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [detail, setDetail] = useState<FeatureJobRunDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [xfProgressFold, setXfProgressFold] = useState<XfLowGoodsProgressFold>({});
  const [uiReportError, setUiReportError] = useState<string | null>(null);
  const [artifactPaths, setArtifactPaths] = useState<{
    artifactDir: string;
    tracePath: string;
    videoDir: string;
    note?: string;
  } | null>(null);
  const [reportStopping, setReportStopping] = useState(false);

  const unsubRef = useRef<(() => void) | null>(null);
  const xfStepParserRef = useRef(createJobStepLineParser());

  const historyProgressFold = useMemo(() => {
    if (!isXfLowGoods || !detail?.log) return {};
    return parseLogToFold(detail.log);
  }, [isXfLowGoods, detail?.log]);

  const refreshSession = useCallback(async () => {
    await fetchSession();
  }, []);

  const loadRuns = useCallback(async () => {
    const filterId = isSaveSession ? SAVE_SESSION_FEATURE_ID : featureId;
    const r = await fetchFeatureRuns(filterId);
    if (!r.ok) {
      setRunsErr(r.error);
      setRuns([]);
      return;
    }
    setRunsErr(null);
    setRuns(r.runs);
  }, [featureId, isSaveSession]);

  useEffect(() => {
    void fetchFeatures().then((rows) => {
      setFeatures(rows);
      setFeaturesLoaded(true);
    });
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  useEffect(() => () => unsubRef.current?.(), []);

  useEffect(() => {
    if (!selectedRunId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    void fetchFeatureRunDetail(selectedRunId).then((r) => {
      if (cancelled) return;
      setDetailLoading(false);
      if (r.ok) setDetail(r.run);
      else setDetail(null);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedRunId]);

  useEffect(() => {
    if (isXfLowGoods) return;
    xfStepParserRef.current.reset();
    setXfProgressFold({});
  }, [isXfLowGoods]);

  function attachLogStream(jobId: string) {
    unsubRef.current?.();
    setLogText("");
    unsubRef.current = subscribeJobLogs(jobId, {
      onAppend: (t) => {
        setLogText((x) => x + t);
        if (featureId === XF_LOW_GOODS_FEATURE_ID) {
          const ev = xfStepParserRef.current.push(t);
          if (ev.length) setXfProgressFold((f) => mergeProgressFold(f, ev));
        }
      },
      onEnd: (code) => {
        setLogText((t) => t + `\n--- 结束 exitCode=${code ?? "?"} ---\n`);
        if (featureId === XF_LOW_GOODS_FEATURE_ID) {
          const tail = xfStepParserRef.current.flush();
          if (tail.length) setXfProgressFold((f) => mergeProgressFold(f, tail));
        }
        unsubRef.current = null;
        void refreshSession();
        void loadRuns();
      },
    });
  }

  async function runFeature() {
    if (isSaveSession) return;
    setActiveJobId(null);
    setArtifactPaths(null);
    if (featureId === XF_LOW_GOODS_FEATURE_ID) {
      xfStepParserRef.current.reset();
      setXfProgressFold({});
    }
    const j = await postRunJob(featureId, headed);
    if ("error" in j) {
      setLogText(`错误: ${j.error}`);
      return;
    }
    setActiveJobId(j.jobId);
    attachLogStream(j.jobId);
  }

  async function startSaveSession() {
    if (!isSaveSession) return;
    setSaveJobId(null);
    setArtifactPaths(null);
    const j = await postSaveSessionJob();
    if ("error" in j) {
      setLogText(`错误: ${j.error}`);
      return;
    }
    setSaveJobId(j.jobId);
    attachLogStream(j.jobId);
  }

  async function confirmSaveSession() {
    if (!saveJobId) return;
    const r = await postSaveSessionConfirm(saveJobId);
    if (!r.ok) setLogText((t) => t + `\n确认保存失败: ${r.error ?? "unknown"}\n`);
    void refreshSession();
  }

  async function triggerUiReportError() {
    const jobId = activeJobId ?? saveJobId;
    if (jobId) {
      setReportStopping(true);
      try {
        const r = await postJobReportError(jobId);
        if (r.ok) {
          unsubRef.current?.();
          unsubRef.current = null;
          setActiveJobId(null);
          setSaveJobId(null);
          setUiReportError(null);
          setArtifactPaths({
            artifactDir: r.artifactDir,
            tracePath: r.tracePath,
            videoDir: r.videoDir,
            note: r.note,
          });
          setLogText(
            (t) =>
              t +
              `\n[ui] Report error：已向子进程发送停止信号；浏览器关闭后写入 trace 与 video。\n` +
              `artifactDir: ${r.artifactDir}\ntrace: ${r.tracePath}\nvideoDir: ${r.videoDir}\n`,
          );
          void loadRuns();
          void refreshSession();
          return;
        }
        if (r.artifactDir && r.tracePath && r.videoDir) {
          setArtifactPaths({
            artifactDir: r.artifactDir,
            tracePath: r.tracePath,
            videoDir: r.videoDir,
            note: r.error,
          });
        }
        setUiReportError(r.error);
        setLogText((t) => t + `\n[ui] Report error 请求失败: ${r.error}\n`);
      } finally {
        setReportStopping(false);
      }
      return;
    }

    const msg = "Report error（无运行中任务，仅前端调试）";
    console.error("[FeatureDetailPage]", msg);
    setUiReportError(msg);
    setLogText((t) => t + `\n[ui] ${msg}\n`);
  }

  const knownFeature = features.find((f) => f.id === featureId);
  const invalidFeature = featuresLoaded && !isSaveSession && !knownFeature;

  if (!featuresLoaded) {
    return (
      <div className="mx-auto max-w-6xl py-12 text-center text-sm text-muted-foreground">加载功能列表…</div>
    );
  }

  if (invalidFeature) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <h1 className="text-lg font-semibold text-foreground">未知功能</h1>
        <p className="text-sm text-muted-foreground">
          没有找到 id 为 <code className="rounded bg-muted px-1">{featureId}</code> 的注册功能。
        </p>
        <Button type="button" variant="secondary" asChild>
          <Link to="/features">
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            返回总览
          </Link>
        </Button>
      </div>
    );
  }

  const title = isSaveSession ? "保存登录态" : knownFeature?.displayName ?? featureId;
  const subtitle = isSaveSession ? "CLI --save-session · 历史 featureId 为 save-session" : `CLI --feature=${featureId}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button type="button" variant="ghost" size="sm" className="-ml-2 mb-2 h-8 px-2 text-muted-foreground" asChild>
            <Link to="/features">
              <ArrowLeft className="mr-1 size-4" aria-hidden />
              Features 总览
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <Tabs defaultValue="console" className="w-full">
        <TabsList className="flex w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="console">控制台</TabsTrigger>
          <TabsTrigger value="history">历史记录</TabsTrigger>
        </TabsList>

        <TabsContent value="console" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">运行</CardTitle>
                <CardDescription>
                  {isSaveSession
                    ? "浏览器 headed，完成后在终端侧按 Enter 写入 storage-state。Report error 可停止任务并保留 trace/video（Chromium 流程）。"
                    : "通过 API 子进程执行 CLI；日志经 SSE 推送。Report error 会向子进程发停止信号并落盘 trace.zip 与 video/。"}
                </CardDescription>
              </div>
              {!isSaveSession ? (
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={headed}
                    onChange={(e) => setHeaded(e.target.checked)}
                    className="size-4 rounded border-input accent-primary"
                  />
                  Playwright headed
                </label>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              {isSaveSession ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" onClick={() => void startSaveSession()}>
                    开始保存登录态
                  </Button>
                  <Button type="button" variant="outline" disabled={!saveJobId} onClick={() => void confirmSaveSession()}>
                    确认写入 storage（Enter）
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={reportStopping}
                    className="border-destructive/60 text-destructive hover:bg-destructive/10"
                    onClick={() => void triggerUiReportError()}
                  >
                    {reportStopping ? "Stopping…" : "Report error"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" onClick={() => void runFeature()}>
                    运行 {knownFeature?.displayName ?? featureId}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={reportStopping}
                    className="border-destructive/60 text-destructive hover:bg-destructive/10"
                    onClick={() => void triggerUiReportError()}
                  >
                    {reportStopping ? "Stopping…" : "Report error"}
                  </Button>
                </div>
              )}

              {artifactPaths ? (
                <div className="space-y-2 rounded-md border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="font-medium text-foreground">调试产物（仓库根下绝对路径，浏览器关闭后文件就绪）</span>
                    <Button type="button" variant="ghost" size="sm" className="h-7 shrink-0" onClick={() => setArtifactPaths(null)}>
                      清除
                    </Button>
                  </div>
                  <dl className="space-y-1 font-mono text-[0.7rem] leading-snug text-muted-foreground">
                    <div>
                      <dt className="text-foreground/80">artifactDir</dt>
                      <dd className="break-all text-foreground">{artifactPaths.artifactDir}</dd>
                    </div>
                    <div>
                      <dt className="text-foreground/80">trace.zip</dt>
                      <dd className="break-all text-foreground">{artifactPaths.tracePath}</dd>
                    </div>
                    <div>
                      <dt className="text-foreground/80">video/</dt>
                      <dd className="break-all text-foreground">{artifactPaths.videoDir}</dd>
                    </div>
                  </dl>
                  <p className="text-xs text-muted-foreground">
                    查看 trace：<code className="rounded bg-muted/80 px-1">npx playwright show-trace &quot;{artifactPaths.tracePath}&quot;</code>
                  </p>
                  {artifactPaths.note ? <p className="text-xs text-muted-foreground">{artifactPaths.note}</p> : null}
                </div>
              ) : null}

              {uiReportError ? (
                <div className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <span>{uiReportError}</span>
                  <Button type="button" variant="ghost" size="sm" className="h-7 shrink-0 text-destructive hover:bg-destructive/15" onClick={() => setUiReportError(null)}>
                    清除
                  </Button>
                </div>
              ) : null}

              {(activeJobId || saveJobId) && (
                <p className="text-xs text-muted-foreground">
                  任务{" "}
                  <code className="rounded bg-muted px-1 py-0.5">{activeJobId ?? saveJobId}</code>
                </p>
              )}

              {isXfLowGoods ? (
                <XfLowGoodsProgress fold={xfProgressFold} subtitle="当前控制台任务日志的实时解析（__JOB_STEP__）" />
              ) : null}

              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">日志</h3>
                <ScrollArea className="h-[min(420px,55vh)] rounded-lg border bg-slate-950">
                  <pre className="break-words p-3 font-mono text-[0.72rem] leading-relaxed whitespace-pre-wrap text-slate-100">
                    {logText || "尚无输出"}
                  </pre>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
              <div>
                <CardTitle className="text-base">运行历史</CardTitle>
                <CardDescription>服务端落盘于 .data/feature-job-history.json（本地、不入库）</CardDescription>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => void loadRuns()}>
                刷新
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {runsErr ? (
                <p className="text-sm text-destructive">{runsErr}</p>
              ) : runs.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无记录；在本页控制台运行一次后即可查看。</p>
              ) : (
                <div className="max-h-[min(52vh,520px)] overflow-auto rounded-md border">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background shadow-[inset_0_-1px_0_0_hsl(var(--border))]">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-40 whitespace-nowrap">开始 (UTC+8)</TableHead>
                        <TableHead className="w-40 whitespace-nowrap">结束 (UTC+8)</TableHead>
                        <TableHead className="w-24">退出码</TableHead>
                        <TableHead className="w-20">headed</TableHead>
                        <TableHead className="w-24">类型</TableHead>
                        <TableHead>日志预览</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {runs.map((row) => {
                        const sel = selectedRunId === row.id;
                        return (
                          <TableRow
                            key={row.id}
                            className={sel ? "bg-muted/50" : "cursor-pointer"}
                            onClick={() => setSelectedRunId(row.id)}
                          >
                            <TableCell className="align-top font-mono text-xs whitespace-nowrap">
                              {formatAsiaShanghai(row.startedAt)}
                            </TableCell>
                            <TableCell className="align-top font-mono text-xs whitespace-nowrap">
                              {formatAsiaShanghai(row.endedAt)}
                            </TableCell>
                            <TableCell className="align-top">
                              <Badge variant={row.exitCode === 0 ? "success" : "destructive"} className="tabular-nums">
                                {row.exitCode ?? "—"}
                              </Badge>
                            </TableCell>
                            <TableCell className="align-top text-xs text-muted-foreground">
                              {row.kind === "save" ? "—" : row.headed ? "是" : "否"}
                            </TableCell>
                            <TableCell className="align-top font-mono text-xs">{row.kind}</TableCell>
                            <TableCell className="max-w-md align-top font-mono text-[0.65rem] text-muted-foreground">
                              <span className="line-clamp-4 whitespace-pre-wrap break-all">{row.logPreview || "—"}</span>
                              <span className="mt-1 block text-[0.6rem] text-muted-foreground/80">{row.logChars} 字符</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {selectedRunId ? (
                <Card className="border-dashed bg-muted/15">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">完整日志</CardTitle>
                    <CardDescription className="font-mono text-xs">{selectedRunId}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {detailLoading ? (
                      <p className="text-sm text-muted-foreground">加载中…</p>
                    ) : detail ? (
                      <>
                        {isXfLowGoods ? (
                          <XfLowGoodsProgress fold={historyProgressFold} subtitle="所选运行记录的日志解析" />
                        ) : null}
                        <ScrollArea className="h-[min(360px,50vh)] rounded-lg border bg-slate-950">
                        <pre className="break-words p-3 font-mono text-[0.72rem] leading-relaxed whitespace-pre-wrap text-slate-100">
                          {detail.log || "—"}
                        </pre>
                      </ScrollArea>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">无法加载该条记录。</p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <p className="text-xs text-muted-foreground">点击表格一行查看完整日志。</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
