/**
 * 登录态管理 API
 *
 * 功能描述：提供登录态的查询、保存、校验、清除等 REST API 接口
 *
 * @route GET /api/session - 查询当前登录态状态
 * @route POST /api/session - 保存/刷新登录态
 * @route DELETE /api/session - 清除登录态
 * @route POST /api/session/validate - 校验登录态是否有效
 */
import { NextRequest, NextResponse } from "next/server";
import {
  checkSessionStatus,
  validateSession,
  clearSession,
  saveSessionInteractive,
  finalizeSaveSessionFromPage,
  getSessionFileInfo,
  SessionStatus,
  SaveSessionResult,
} from "@/lib/session-manager";

/**
 * 全局变量，用于在 POST 请求的生命周期内跟踪浏览器页面引用
 * 注意：Next.js 无状态 API 路由中，此方式仅用于演示/开发环境
 */
let currentPageRef: any = null;

/**
 * GET /api/session
 *
 * 查询登录态状态信息，包括文件存在性、cookies 数量、是否过期等
 *
 * @returns {NextResponse} 包含登录态状态信息的 JSON 响应
 */
export async function GET(): Promise<NextResponse> {
  try {
    const status: SessionStatus = checkSessionStatus();
    const fileInfo = getSessionFileInfo();

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        fileSize: fileInfo.fileSize,
      },
    });
  } catch (error) {
    console.error("[Session API] GET 错误:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "查询登录态失败",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/session
 *
 * 保存登录态。支持两种模式：
 * 1. 普通模式：启动浏览器等待用户登录（action: "save"）
 * 2. 从 CDP 浏览器保存（action: "saveFromCDP", 需传入 port）
 * 3. 最终确定保存（action: "finalize"）
 *
 * @param {NextRequest} request - 请求体需包含 { action: string, port?: number }
 * @returns {NextResponse} 保存结果
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, port } = body;

    // === 校验登录态 ===
    if (action === "validate") {
      const result = await validateSession();
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // === 启动浏览器保存登录态 ===
    if (action === "save") {
      const result: SaveSessionResult = await saveSessionInteractive({
        port: port || undefined,
      });
      return NextResponse.json({
        success: result.success,
        data: result,
        // 如果是启动浏览器的模式，需要告知前端等待用户操作
        requiresUserAction: !port,
      });
    }

    // === 从后端页面引用最终确定保存 ===
    if (action === "finalize") {
      if (!currentPageRef) {
        return NextResponse.json(
          {
            success: false,
            error: "没有正在进行的保存会话，请先调用 save 或 saveFromCDP",
          },
          { status: 400 }
        );
      }
      const result = await finalizeSaveSessionFromPage(currentPageRef);
      currentPageRef = null; // 清除引用
      return NextResponse.json({
        success: result.success,
        data: result,
      });
    }

    // === 连接到 CDP 端口并保存 ===
    if (action === "saveFromCDP") {
      if (!port) {
        return NextResponse.json(
          {
            success: false,
            error: "CDP 模式下需要提供 port 参数",
          },
          { status: 400 }
        );
      }
      const result: SaveSessionResult = await saveSessionInteractive({ port });
      return NextResponse.json({
        success: result.success,
        data: result,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "未知的 action，支持: save, saveFromCDP, finalize, validate",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Session API] POST 错误:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "操作失败",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/session
 *
 * 清除已保存的登录态文件
 *
 * @returns {NextResponse} 清除结果
 */
export async function DELETE(): Promise<NextResponse> {
  try {
    const result = clearSession();
    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    console.error("[Session API] DELETE 错误:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "清除登录态失败",
      },
      { status: 500 }
    );
  }
}
