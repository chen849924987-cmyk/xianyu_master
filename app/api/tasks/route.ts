import { NextResponse } from "next/server";
import { getAvailableTasks } from "@/lib/api-server";

/**
 * GET /api/tasks - 获取可用任务列表
 */
export async function GET() {
  try {
    const tasks = getAvailableTasks();
    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "获取任务列表失败" },
      { status: 500 }
    );
  }
}
