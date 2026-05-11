import { NextRequest, NextResponse } from "next/server";
import {
  getScheduledTasks,
  setScheduledTasks,
  calculateNextRun,
  registerCronTask,
} from "@/lib/api-server";

/**
 * PUT /api/scheduled-tasks/:id - 更新定时任务
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tasks = getScheduledTasks();
    const idx = tasks.findIndex((t) => t.id === id);

    if (idx === -1) {
      return NextResponse.json(
        { success: false, error: "任务未找到" },
        { status: 404 }
      );
    }

    tasks[idx] = {
      ...tasks[idx],
      ...body,
      nextRun: calculateNextRun(body.cronExpression || tasks[idx].cronExpression),
    };
    setScheduledTasks(tasks);
    registerCronTask(tasks[idx]);

    return NextResponse.json({ success: true, data: tasks[idx] });
  } catch {
    return NextResponse.json(
      { success: false, error: "更新失败" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scheduled-tasks/:id - 删除定时任务
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tasks = getScheduledTasks().filter((t) => t.id !== id);
    setScheduledTasks(tasks);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "删除失败" },
      { status: 500 }
    );
  }
}
