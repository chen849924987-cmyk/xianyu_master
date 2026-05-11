import { NextRequest, NextResponse } from "next/server";
import {
  getScheduledTasks,
  setScheduledTasks,
  calculateNextRun,
  registerCronTask,
} from "@/lib/api-server";

/**
 * GET /api/scheduled-tasks - 获取定时任务列表
 */
export async function GET() {
  try {
    const tasks = getScheduledTasks();
    return NextResponse.json({ success: true, data: tasks });
  } catch {
    return NextResponse.json(
      { success: false, error: "获取定时任务失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scheduled-tasks - 添加定时任务
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const task = {
      id: Date.now().toString(),
      name: body.name,
      scriptPath: body.scriptPath,
      cronExpression: body.cronExpression,
      enabled: body.enabled !== false,
      lastRun: "",
      nextRun: calculateNextRun(body.cronExpression),
      createdAt: new Date().toISOString(),
    };
    const tasks = getScheduledTasks();
    tasks.push(task);
    setScheduledTasks(tasks);
    registerCronTask(task);
    return NextResponse.json({ success: true, data: task });
  } catch {
    return NextResponse.json(
      { success: false, error: "添加定时任务失败" },
      { status: 500 }
    );
  }
}
