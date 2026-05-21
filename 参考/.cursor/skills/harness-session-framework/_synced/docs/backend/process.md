# 进程管理规范

## Job 存储

使用 Map 存储运行中的 Job：

```typescript
type JobRecord = {
  kind: "run" | "save";
  jobId: string;
  featureId: string | null;
  headed: boolean;
  startedAt: string;
  proc: ChildProcess;
  chunks: string[];        // 日志缓存
  sse: Set<Response>;      // SSE 客户端
  ended: boolean;
  exitCode: number | null;
};

const jobs = new Map<string, JobRecord>();
```

## 子进程启动

```typescript
function spawnCli(args: string[], env?: NodeJS.ProcessEnv): ChildProcess {
  const tsx = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
  
  if (!fs.existsSync(tsx)) {
    throw new Error("未找到 tsx，请先 npm install");
  }
  
  return spawn(process.execPath, [tsx, cliTsPath(), "--", ...args], {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
}
```

## 清理逻辑

```typescript
function killAllJobs(): void {
  for (const [, job] of jobs) {
    try {
      job.proc.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  }
  jobs.clear();
}

// 信号处理
process.on("SIGINT", () => {
  killAllJobs();
  process.exit(0);
});

process.on("SIGTERM", () => {
  killAllJobs();
  process.exit(0);
});
```

## Job 生命周期

```typescript
function attachIo(jobId: string, job: JobRecord): void {
  const { proc } = job;
  
  // 捕获输出
  proc.stdout?.setEncoding("utf8");
  proc.stderr?.setEncoding("utf8");
  proc.stdout?.on("data", (d: string) => appendLog(job, d));
  proc.stderr?.on("data", (d: string) => appendLog(job, d));
  
  // 进程结束处理
  proc.on("close", (code) => {
    job.ended = true;
    job.exitCode = code ?? null;
    
    // 广播结束事件
    broadcast(job, { type: "end", exitCode: job.exitCode });
    
    // 保存运行记录
    saveJobRunHistory(job);
    
    // 清理 SSE 连接
    for (const res of job.sse) {
      try { res.end(); } catch { /* ignore */ }
    }
    job.sse.clear();
    
    // 延迟清理 Map
    setTimeout(() => jobs.delete(jobId), 120_000);
  });
}
```
