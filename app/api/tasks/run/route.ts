import { NextRequest, NextResponse } from "next/server";
import { runScript } from "@/lib/api-server";

/**
 * POST /api/tasks/run - 立即运行脚本
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await runScript(body.scriptPath);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "执行失败";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
