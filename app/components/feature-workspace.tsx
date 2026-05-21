"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FeatureDefinition } from "@/lib/feature-registry";
import { IconClock, IconPlay, IconScroll } from "./icons";

interface FeatureWorkspaceProps {
  feature: FeatureDefinition;
}

/**
 * 单功能工作台：历史记录 / 实时日志 / 报错日志（占位 + 试运行触发）
 */
export function FeatureWorkspace({ feature }: FeatureWorkspaceProps) {
  const [running, setRunning] = useState(false);
  const [liveLines, setLiveLines] = useState<string[]>([
    "[占位] 实时日志流尚未完全接入，执行任务后将在此显示输出。",
    "[提示] 计划通过 GET /api/events (SSE) 按 scriptPath 过滤推送。",
  ]);
  const [errorLines, setErrorLines] = useState<string[]>([
    "[占位] 暂无报错；失败任务的 stderr 与堆栈将集中显示于此。",
  ]);
  const liveRef = useRef<HTMLDivElement>(null);

  const appendLive = useCallback((line: string) => {
    setLiveLines((prev) => [...prev.slice(-199), line]);
  }, []);

  useEffect(() => {
    liveRef.current?.scrollTo({ top: liveRef.current.scrollHeight, behavior: "smooth" });
  }, [liveLines]);

  const runTask = async () => {
    setRunning(true);
    appendLive(`[${new Date().toLocaleTimeString("zh-CN")}] 触发: ${feature.scriptPath}`);
    try {
      const resp = await fetch("/api/tasks/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptPath: feature.scriptPath }),
      });
      const json = await resp.json();
      if (json.success) {
        appendLive(
          `[${new Date().toLocaleTimeString("zh-CN")}] 已提交，状态: ${json.data?.status ?? "unknown"}`
        );
        if (json.data?.output) {
          appendLive(String(json.data.output).slice(0, 800));
        }
      } else {
        const err = json.error || "执行失败";
        setErrorLines((prev) => [
          ...prev.slice(-49),
          `[${new Date().toLocaleTimeString("zh-CN")}] ${err}`,
        ]);
        appendLive(`[${new Date().toLocaleTimeString("zh-CN")}] 失败: ${err}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorLines((prev) => [
        ...prev.slice(-49),
        `[${new Date().toLocaleTimeString("zh-CN")}] ${msg}`,
      ]);
      appendLive(`[${new Date().toLocaleTimeString("zh-CN")}] 请求异常: ${msg}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="feature-workspace">
      <div className="card feature-meta">
        <div className="card-body feature-meta-body">
          <div>
            <span className="badge badge-neutral">{feature.category}</span>
            <p className="feature-meta-desc">{feature.description}</p>
            <code className="feature-meta-path">{feature.scriptPath}</code>
          </div>
          <div className="feature-meta-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={running}
              onClick={runTask}
            >
              {running ? (
                <>
                  <span className="spinner" /> 执行中…
                </>
              ) : (
                <>
                  <IconPlay size={16} /> 立即运行
                </>
              )}
            </button>
            <Link href="/#schedule" className="btn btn-outline">
              <IconClock size={16} /> 配置定时
            </Link>
          </div>
        </div>
      </div>

      <div className="feature-panels">
        <section className="card feature-panel">
          <header className="card-header">
            <h3>
              <IconScroll size={18} />
              历史记录
            </h3>
            <span className="placeholder-badge">占位</span>
          </header>
          <div className="card-body">
            <p className="panel-placeholder-hint">
              将展示该功能的历次执行（时间、状态、耗时、摘要）。计划接口：
              <code> GET /api/features/{feature.slug}/history</code>
            </p>
            <div className="table-wrap">
              <table className="task-table">
                <thead>
                  <tr>
                    <th>执行时间</th>
                    <th>状态</th>
                    <th>耗时</th>
                    <th>摘要</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={4} className="empty-cell">
                      暂无历史记录（占位）
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="card feature-panel feature-panel--logs">
          <header className="card-header">
            <h3>实时日志</h3>
            <span className="placeholder-badge">占位 · 可试运行</span>
          </header>
          <div className="card-body">
            <p className="panel-placeholder-hint">
              执行过程 stdout 流式输出；完整方案对接 <code>/api/events</code> SSE。
            </p>
            <div ref={liveRef} className="log-container log-container--live">
              {liveLines.map((line, i) => (
                <div key={`live-${i}`} className="log-entry">
                  <span className="log-info">{line}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card feature-panel feature-panel--errors">
          <header className="card-header">
            <h3>报错日志</h3>
            <span className="placeholder-badge placeholder-badge--danger">占位</span>
          </header>
          <div className="card-body">
            <p className="panel-placeholder-hint">
              错误输出与堆栈。计划接口：
              <code> GET /api/features/{feature.slug}/errors</code>
            </p>
            <div className="log-container log-container--errors">
              {errorLines.map((line, i) => (
                <div key={`err-${i}`} className="log-entry">
                  <span className="log-error">{line}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
