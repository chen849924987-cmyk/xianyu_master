import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Database, ExternalLink } from "lucide-react";

import { fetchFeatures, fetchSession, postSaveSessionConfirm, postSaveSessionJob } from "@/api/client";
import type { FeatureRow } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SAVE_SESSION_FEATURE_ID } from "@/lib/feature-routes";
import { subscribeJobLogs } from "@/lib/job-log-stream";
import { ScrollArea } from "@/components/ui/scroll-area";

export function FeaturesOverviewPage() {
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [logText, setLogText] = useState("");
  const [saveJobId, setSaveJobId] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const refreshSession = useCallback(async () => {
    await fetchSession();
  }, []);

  useEffect(() => {
    void fetchFeatures().then(setFeatures);
  }, []);

  useEffect(() => () => unsubRef.current?.(), []);

  function attachLogStream(jobId: string) {
    unsubRef.current?.();
    setLogText("");
    unsubRef.current = subscribeJobLogs(jobId, {
      onAppend: (t) => setLogText((x) => x + t),
      onEnd: (code) => {
        setLogText((t) => t + `\n--- 结束 exitCode=${code ?? "?"} ---\n`);
        unsubRef.current = null;
        void refreshSession();
      },
    });
  }

  async function startSaveSession() {
    setSaveJobId(null);
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

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Features 总览</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          每个功能有独立页面（侧边栏或下方卡片进入），可查看运行控制台与历史日志。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{f.displayName}</CardTitle>
              <CardDescription className="font-mono text-xs">{f.id}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto flex flex-wrap gap-2 pt-0">
              <Button type="button" size="sm" variant="secondary" asChild>
                <Link to={`/features/${f.id}`}>
                  <ExternalLink className="mr-1.5 size-3.5" aria-hidden />
                  打开页面
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}

        <Card className="border-primary/25 bg-primary/[0.03]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="size-4" aria-hidden />
              保存登录态
            </CardTitle>
            <CardDescription className="text-xs">对应 CLI{" "}
              <code className="rounded bg-muted px-1">--save-session</code>，历史记在{" "}
              <span className="font-mono">save-session</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto flex flex-wrap gap-2 pt-0">
            <Button type="button" size="sm" variant="secondary" asChild>
              <Link to={`/features/${SAVE_SESSION_FEATURE_ID}`}>打开页面</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">快捷：保存登录态</CardTitle>
          <CardDescription>也可在「保存登录态」独立页操作；日志会写入该功能的历史记录。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void startSaveSession()}>
              开始保存登录态（headed）
            </Button>
            <Button type="button" variant="outline" disabled={!saveJobId} onClick={() => void confirmSaveSession()}>
              确认写入 storage（Enter）
            </Button>
          </div>
          {saveJobId ? (
            <p className="text-xs text-muted-foreground">
              任务 ID <code className="rounded bg-muted px-1 py-0.5">{saveJobId}</code>
            </p>
          ) : null}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">日志（SSE）</h3>
            <ScrollArea className="h-[min(280px,40vh)] rounded-lg border bg-slate-950">
              <pre className="break-words p-3 font-mono text-[0.72rem] leading-relaxed whitespace-pre-wrap text-slate-100">
                {logText || "尚无输出"}
              </pre>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      <Separator className="opacity-60" />
      <p className="text-center text-xs text-muted-foreground">
        API <span className="font-mono">POST /api/jobs/run</span> ·{" "}
        <span className="font-mono">GET /api/feature-runs?featureId=…</span>
      </p>
    </div>
  );
}
