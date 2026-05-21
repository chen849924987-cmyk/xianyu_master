/** 订阅 `/api/jobs/:jobId/logs` SSE，返回取消订阅函数 */
export function subscribeJobLogs(
  jobId: string,
  handlers: {
    onAppend: (chunk: string) => void;
    onEnd: (exitCode: number | null) => void;
  },
): () => void {
  const es = new EventSource(`/api/jobs/${jobId}/logs`);
  es.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data) as { type?: string; text?: string; exitCode?: number | null };
      if (msg.type === "log" && msg.text) handlers.onAppend(msg.text);
      if (msg.type === "end") {
        handlers.onEnd(msg.exitCode ?? null);
        es.close();
      }
    } catch {
      /* ignore */
    }
  };
  es.onerror = () => {
    es.close();
  };
  return () => es.close();
}
