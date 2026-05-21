/**
 * 后端服务核心逻辑
 * 
 * 封装原 backend/main.cjs 的功能，供 Next.js API Routes 调用
 */

import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import cron from "node-cron";
import { FEATURES } from "@/lib/feature-registry";

// ========== 路径常量 ==========
export const APP_ROOT = path.resolve(process.cwd());
export const STORE_DIR = path.join(APP_ROOT, "backend", "store");
export const SCHEDULED_TASKS_FILE = path.join(STORE_DIR, "scheduled_tasks.json");
export const TASK_LOGS_FILE = path.join(STORE_DIR, "task_logs.json");

// ========== 确保存储目录存在 ==========
if (!fs.existsSync(STORE_DIR)) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
}

// ========== JSON 文件存储 ==========
function readJSON<T>(filePath: string, defaultVal: T = [] as T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch {
    /* ignore */
  }
  return defaultVal;
}

function writeJSON(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ========== 数据类型 ==========
export interface TaskItem {
  name: string;
  path: string;
}

export interface ScheduledTask {
  id: string;
  name: string;
  scriptPath: string;
  cronExpression: string;
  enabled: boolean;
  lastRun: string;
  nextRun: string;
  createdAt: string;
}

export interface TaskLogEntry {
  id: string;
  scriptPath: string;
  startTime: string;
  endTime: string;
  status: "running" | "success" | "failed";
  output: string;
}

// ========== 可用任务列表（与 lib/feature-registry 同步） ==========
export function getAvailableTasks(): TaskItem[] {
  return FEATURES.map((f) => ({ name: f.name, path: f.scriptPath }));
}

// ========== 定时任务存储 ==========
export function getScheduledTasks(): ScheduledTask[] {
  return readJSON<ScheduledTask[]>(SCHEDULED_TASKS_FILE, []);
}

export function setScheduledTasks(tasks: ScheduledTask[]) {
  writeJSON(SCHEDULED_TASKS_FILE, tasks);
}

// ========== 日志存储 ==========
export function getTaskLogs(): TaskLogEntry[] {
  return readJSON<TaskLogEntry[]>(TASK_LOGS_FILE, []);
}

export function setTaskLogs(logs: TaskLogEntry[]) {
  writeJSON(TASK_LOGS_FILE, logs);
}

// ========== 计算下次执行时间 ==========
export function calculateNextRun(cronExpression: string): string {
  try {
    const cronParts = cronExpression.split(" ");
    if (cronParts.length === 5) {
      const [minute, hour] = cronParts;
      const now = new Date();
      const next = new Date(now);
      if (hour !== "*") {
        next.setHours(parseInt(hour), parseInt(minute) || 0, 0, 0);
        if (next <= now) next.setDate(next.getDate() + 1);
      } else if (minute !== "*") {
        next.setMinutes(parseInt(minute), 0, 0);
        if (next <= now) next.setMinutes(next.getMinutes() + 60);
      } else {
        next.setMinutes(next.getMinutes() + 1);
      }
      return next.toISOString();
    }
  } catch {
    /* ignore */
  }
  return "";
}

// ========== 解析脚本完整路径 ==========
export function resolveScriptPath(scriptPath: string): string {
  if (scriptPath.startsWith("backend/") || scriptPath.startsWith("backend\\")) {
    return path.join(APP_ROOT, scriptPath);
  }
  const withBackend = path.join(APP_ROOT, "backend", scriptPath);
  if (fs.existsSync(withBackend)) {
    return withBackend;
  }
  return path.join(APP_ROOT, scriptPath);
}

// ========== Cron 任务管理 ==========
const cronJobs = new Map<string, ReturnType<typeof cron.schedule>>();

/** SSE 回调类型 */
type SSECallback = (event: string, data: unknown) => void;
let sseCallback: SSECallback | null = null;

export function setSSECallback(cb: SSECallback) {
  sseCallback = cb;
}

function broadcastSSE(event: string, data: unknown) {
  if (sseCallback) {
    sseCallback(event, data);
  }
}

export function registerCronTask(task: ScheduledTask) {
  const existing = cronJobs.get(task.id);
  if (existing) {
    existing.stop();
    cronJobs.delete(task.id);
  }
  if (!task.enabled) return;

  try {
    const job = cron.schedule(task.cronExpression, async () => {
      task.lastRun = new Date().toISOString();
      const tasks = getScheduledTasks();
      const idx = tasks.findIndex((t) => t.id === task.id);
      if (idx !== -1) {
        tasks[idx].lastRun = task.lastRun;
        setScheduledTasks(tasks);
      }
      broadcastSSE("task-triggered", task);
      await runScript(task.scriptPath);
    });
    cronJobs.set(task.id, job);

    // 更新下次运行时间
    const tasks = getScheduledTasks();
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx !== -1) {
      tasks[idx].nextRun = calculateNextRun(task.cronExpression);
      setScheduledTasks(tasks);
    }
  } catch (err) {
    console.error(`定时任务注册失败: ${task.name}`, err);
  }
}

export function initScheduledTasks() {
  const tasks = getScheduledTasks();
  console.log(`[定时任务] 初始化 ${tasks.length} 个任务...`);
  tasks.forEach((task) => registerCronTask(task));
}

// ========== 模块加载时自动初始化（Next.js 启动时机）==========
initScheduledTasks();

// ========== 执行脚本 ==========
export function runScript(
  scriptPath: string
): Promise<TaskLogEntry> {
  return new Promise((resolve, reject) => {
    const fullPath = resolveScriptPath(scriptPath);
    const logEntry: TaskLogEntry = {
      id: Date.now().toString(),
      scriptPath,
      startTime: new Date().toISOString(),
      endTime: "",
      status: "running",
      output: "",
    };

    broadcastSSE("task-log", logEntry);

    const child = spawn("node", [fullPath], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
      cwd: APP_ROOT,
    });

    let output = "";

    child.stdout.on("data", (data: Buffer) => {
      const text = data.toString();
      output += text;
      broadcastSSE("task-output", { id: logEntry.id, output: text });
    });

    child.stderr.on("data", (data: Buffer) => {
      const text = data.toString();
      output += text;
      broadcastSSE("task-output", { id: logEntry.id, output: text });
    });

    child.on("close", (code: number | null) => {
      logEntry.endTime = new Date().toISOString();
      logEntry.status = code === 0 ? "success" : "failed";
      logEntry.output = output;

      const logs = getTaskLogs();
      logs.unshift(logEntry);
      setTaskLogs(logs.slice(0, 200));

      broadcastSSE("task-complete", logEntry);
      resolve(logEntry);
    });

    child.on("error", (err: Error) => {
      logEntry.endTime = new Date().toISOString();
      logEntry.status = "failed";
      logEntry.output = err.message;

      const logs = getTaskLogs();
      logs.unshift(logEntry);
      setTaskLogs(logs.slice(0, 200));

      broadcastSSE("task-complete", logEntry);
      reject(err);
    });
  });
}
