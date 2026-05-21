/**
 * 登录态管理 API
 *
 * 功能描述：提供登录态的查询、保存、校验、清除、导入等 REST API 接口
 *
 * @route GET    /api/session - 查询当前登录态状态（支持 ?filePath=xxx 参数）
 * @route POST   /api/session - 保存/校验/刷新/导入登录态（支持 filePath 参数）
 * @route DELETE /api/session - 清除登录态（支持 ?filePath=xxx 参数）
 */
import { NextRequest, NextResponse } from "next/server";
import {
  checkSessionStatus,
  validateSession,
  clearSession,
  saveSessionInteractive,
  saveSessionFromCDP,
  finalizeInteractiveSave,
  getSessionFileInfo,
  importSessionFromPath,
  SessionStatus,
  SaveSessionResult,
  ImportSessionResult,
} from "@/lib/session-manager";

/**
 * 从请求中提取可选的 filePath 参数
 *
 * @param request - Next.js 请求对象
 * @returns 自定义文件路径，如果未提供则返回 undefined
 */
function getFilePathFromRequest(request: NextRequest): string | undefined {
  const url = new URL(request.url);
  const filePathParam = url.searchParams.get("filePath");
  // 也检查 body 中的 filePath
  return filePathParam || undefined;
}

/**
 * 从请求 body 和 URL 查询参数中提取可选的 filePath
 *
 * @param request - Next.js 请求对象
 * @param body - 已解析的请求体
 * @returns 自定义文件路径，如果未提供则返回 undefined
 */
function extractFilePath(request: NextRequest, body?: Record<string, unknown>): string | undefined {
  // 优先使用 body 中的 filePath
  if (body?.filePath && typeof body.filePath === "string" && body.filePath.trim()) {
    return body.filePath.trim();
  }
  // 其次使用查询参数
  return getFilePathFromRequest(request);
}

/**
 * GET /api/session
 *
 * 查询登录态状态信息，包括文件存在性、cookies 数量、是否过期等
 * 支持自定义文件路径（?filePath=xxx）
 *
 * @param {NextRequest} request - 可选查询参数 filePath
 * @returns {NextResponse} 包含登录态状态信息的 JSON 响应
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const filePath = getFilePathFromRequest(request);
    const status: SessionStatus = checkSessionStatus(filePath);
    const fileInfo = getSessionFileInfo(filePath);

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
 * 保存登录态。支持多种模式：
 * 1. 校验登录态（action: "validate"）— 支持 filePath
 * 2. 启动浏览器保存（action: "save"）— 支持 filePath/port
 * 3. 从 CDP 浏览器保存（action: "saveFromCDP"）— 支持 filePath/port
 * 4. 最终确定保存（action: "finalize"）— 支持 filePath
 * 5. 导入已有文件（action: "import"）— 支持 sourcePath/copyToDefault
 *
 * @param {NextRequest} request - 请求体需包含 { action, filePath?, port?, sourcePath?, copyToDefault? }
 * @returns {NextResponse} 操作结果
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, port, sourcePath, copyToDefault } = body as Record<string, unknown>;
    const filePath = extractFilePath(request, body);

    // === 导入已有的 storageState 文件 ===
    if (action === "import") {
      if (!sourcePath || typeof sourcePath !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: "导入操作需要提供 sourcePath 参数（源文件路径）",
          },
          { status: 400 }
        );
      }
      const result: ImportSessionResult = importSessionFromPath(
        sourcePath,
        { copyToDefault: copyToDefault !== false }
      );
      return NextResponse.json({
        success: result.success,
        data: result,
      });
    }

    // === 校验登录态 ===
    if (action === "validate") {
      const result = await validateSession(filePath);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // === 启动浏览器保存登录态 ===
    if (action === "save") {
      const cdpPort =
        typeof port === "number"
          ? port
          : port != null
            ? parseInt(String(port), 10)
            : NaN;
      if (!Number.isNaN(cdpPort) && cdpPort > 0) {
        const result = await saveSessionFromCDP({
          port: cdpPort,
          savePath: filePath,
        });
        return NextResponse.json({
          success: result.success,
          data: result,
        });
      }

      const result: SaveSessionResult = await saveSessionInteractive({
        savePath: filePath,
      });
      return NextResponse.json({
        success: result.success,
        data: result,
        requiresUserAction: result.success,
      });
    }

    if (action === "finalize") {
      const result = await finalizeInteractiveSave(filePath);
      return NextResponse.json({
        success: result.success,
        data: result,
      });
    }

    if (action === "saveFromCDP") {
      const cdpPort =
        typeof port === "number"
          ? port
          : port != null
            ? parseInt(String(port), 10)
            : NaN;
      if (Number.isNaN(cdpPort) || cdpPort <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: "CDP 模式下需要提供有效的 port 参数",
          },
          { status: 400 }
        );
      }
      const result = await saveSessionFromCDP({
        port: cdpPort,
        savePath: filePath,
      });
      return NextResponse.json({
        success: result.success,
        data: result,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "未知的 action，支持: save, saveFromCDP, finalize, validate, import",
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
 * 清除已保存的登录态文件。支持自定义文件路径（?filePath=xxx）
 *
 * @param {NextRequest} request - 可选查询参数 filePath
 * @returns {NextResponse} 清除结果
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const filePath = getFilePathFromRequest(request);
    const result = clearSession(filePath);
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
