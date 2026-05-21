import Link from "next/link";
import { ConsoleShell } from "@/app/components/console-shell";

export default function FeatureNotFound() {
  return (
    <ConsoleShell title="功能不存在" description="请从侧栏或控制台选择有效功能模块">
      <div className="card">
        <div className="card-body empty-state">
          <p>未找到对应的功能页面。</p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: 16 }}>
            返回控制台
          </Link>
        </div>
      </div>
    </ConsoleShell>
  );
}
