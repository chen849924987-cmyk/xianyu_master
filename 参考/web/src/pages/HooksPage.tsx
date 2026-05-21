import { HookUsageCharts } from "@/components/hooks/HookUsageCharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function HooksPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Cursor Hooks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          由 <code className="rounded bg-muted px-1 py-0.5 text-xs">run-hook.mjs</code> 写入统计；环形图为「按事件」聚合，条形图为各脚本调用量与成功/失败比例。
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>调用概览</CardTitle>
          <CardDescription>与 Cursor Agent / 工具事件对应的 harness hook 执行情况</CardDescription>
        </CardHeader>
        <CardContent>
          <HookUsageCharts />
        </CardContent>
      </Card>
    </div>
  );
}
