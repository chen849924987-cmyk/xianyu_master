import descriptions from "../../../harness/lib/hook-script-descriptions.json";

const map = descriptions as Record<string, string>;

/** 根据脚本文件名返回 harness 旁注说明；未知脚本返回「—」 */
export function getHookScriptDescription(script: string): string {
  const base = script.replace(/^.*[/\\]/, "");
  return map[base] ?? "—";
}
