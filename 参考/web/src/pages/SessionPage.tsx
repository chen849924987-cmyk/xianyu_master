import { useCallback, useEffect, useState } from "react";

import { fetchSession, postSaveSessionConfirm, postSaveSessionJob } from "@/api/client";
import type { SessionMeta } from "@/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function SessionPage() {
  const [session, setSession] = useState<SessionMeta | null>(null);
  const [saveJobId, setSaveJobId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    setSession(await fetchSession());
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  async function startSaveSession() {
    setActionError(null);
    setSaveJobId(null);
    const j = await postSaveSessionJob();
    if ("error" in j) {
      setActionError(j.error);
      return;
    }
    setSaveJobId(j.jobId);
  }

  async function confirmSaveSession() {
    if (!saveJobId) return;
    setActionError(null);
    const r = await postSaveSessionConfirm(saveJobId);
    if (!r.ok) setActionError(r.error ?? "确认失败");
    void refreshSession();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">登录态</h1>
        <p className="mt-1 text-sm text-muted-foreground">Playwright <code className="rounded bg-muted px-1 py-0.5 text-xs">storage-state.json</code> 元数据与保存流程</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>storage-state</CardTitle>
          <CardDescription>与 CLI <code className="text-xs">--save-session</code> 写入同一文件（默认 <code className="text-xs">.data/storage-state.json</code>）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {session ? (
            <>
              <div className="flex flex-wrap gap-2">
                <span className="text-muted-foreground">路径</span>
                <code className="break-all rounded bg-muted px-2 py-0.5 text-xs">{session.path}</code>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">存在</span>
                <span>{session.exists ? "是" : "否"}</span>
                <Badge variant={session.validJson ? "success" : "destructive"}>
                  JSON {session.validJson ? "可读" : "无效"}
                </Badge>
              </div>
              {session.size != null && (
                <div>
                  <span className="text-muted-foreground">大小 </span>
                  <span className="tabular-nums">{session.size} bytes</span>
                </div>
              )}
              {session.parseError && (
                <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{session.parseError.slice(0, 400)}</p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">加载中…</p>
          )}
        </CardContent>
        {actionError && (
          <div className="border-t px-6 py-3">
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{actionError}</p>
          </div>
        )}
        <CardFooter className="flex flex-wrap gap-2 border-t bg-muted/30">
          <Button type="button" onClick={startSaveSession}>
            开始保存登录态（headed）
          </Button>
          <Button type="button" variant="secondary" disabled={!saveJobId} onClick={confirmSaveSession}>
            确认写入 storage（stdin Enter）
          </Button>
          <Button type="button" variant="outline" onClick={() => void refreshSession()}>
            刷新状态
          </Button>
        </CardFooter>
      </Card>

      <p className="text-xs text-muted-foreground">
        完整日志与任务流建议在 <strong>Features</strong> 页查看 SSE。流程：开始保存 → Chromium 登录 → 确认写入。
      </p>
    </div>
  );
}
