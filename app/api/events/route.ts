/**
 * GET /api/events - SSE 实时事件推送
 * 
 * 替代原 backend/main.cjs 中 /events 端点。
 * 客户端通过 EventSource 连接获取实时任务状态。
 */

import { setSSECallback } from "@/lib/api-server";

let clientCount = 0;

export async function GET() {
  // 生成唯一 client ID
  const clientId = ++clientCount;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        try {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch {
          // 连接已关闭，移除回调
          setSSECallback(() => {});
        }
      };

      // 发送初始连接成功事件
      sendEvent("connected", { clientId });

      // 注册全局 SSE 回调
      setSSECallback((event, data) => {
        sendEvent(event, data);
      });

      // 处理客户端断开连接
      // 注意：在 Next.js 中，请求取消会自动停止流
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
