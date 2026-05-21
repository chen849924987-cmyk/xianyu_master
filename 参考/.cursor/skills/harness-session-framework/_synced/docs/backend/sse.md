# Server-Sent Events 规范

## SSE 端点

```typescript
app.get("/api/jobs/:jobId/logs", (req: Request, res: Response) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "job not found" });
    return;
  }

  // 必须设置 headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  // 发送历史日志
  for (const text of job.chunks) {
    res.write(`data: ${JSON.stringify({ type: "log", text })}
\n`);
  }

  // 已结束则立即关闭
  if (job.ended) {
    res.write(`data: ${JSON.stringify({ type: "end", exitCode: job.exitCode })}
\n`);
    res.end();
    return;
  }

  // 加入 SSE 客户端集合
  job.sse.add(res);

  // 清理监听
  req.on("close", () => {
    job.sse.delete(res);
  });
});
```

## 广播机制

```typescript
function broadcast(job: JobRecord, payload: Record<string, unknown>): void {
  const line = `data: ${JSON.stringify(payload)}
\n`;
  for (const res of job.sse) {
    try {
      res.write(line);
    } catch {
      job.sse.delete(res);
    }
  }
}

function appendLog(job: JobRecord, text: string): void {
  job.chunks.push(text);
  broadcast(job, { type: "log", text });
}
```

## 消息格式

| 类型 | 格式 | 说明 |
|------|------|------|
| 日志 | `{ type: "log", text: string }` | 单行日志输出 |
| 结束 | `{ type: "end", exitCode: number \| null }` | 进程结束通知 |
| 错误 | `{ type: "error", message: string }` | 错误通知 |

## 前端消费

```typescript
const es = new EventSource(`/api/jobs/${jobId}/logs`);

es.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === "log") {
    appendToConsole(data.text);
  } else if (data.type === "end") {
    markAsCompleted(data.exitCode);
    es.close();
  }
};

es.onerror = () => {
  // 连接断开，可尝试重连
};
```
