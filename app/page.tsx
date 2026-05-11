"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// ========== 类型定义 ==========
interface TaskItem {
  name: string;
  path: string;
}

interface ScheduledTask {
  id: string;
  name: string;
  scriptPath: string;
  cronExpression: string;
  enabled: boolean;
  lastRun: string;
  nextRun: string;
  createdAt: string;
}

interface TaskLogEntry {
  id: string;
  scriptPath: string;
  startTime: string;
  endTime: string;
  status: "running" | "success" | "failed";
  output: string;
}

/** 登录态状态信息 */
interface SessionStatus {
  exists: boolean;
  hasCookies: boolean;
  cookieCount: number;
  isExpired: boolean;
  filePath: string;
  lastModified: string | null;
  domains: string[];
  fileSize: number;
}

/** 登录态校验结果 */
interface ValidateResult {
  valid: boolean;
  message: string;
}

// ========== Tab 类型 ==========
type TabId = "dashboard" | "schedule" | "logs" | "session";

const TAB_CONFIG: { id: TabId; label: string; icon: string }[] = [
  { id: "dashboard", label: "控制台", icon: "📊" },
  { id: "schedule", label: "定时任务", icon: "⏰" },
  { id: "logs", label: "运行日志", icon: "📜" },
  { id: "session", label: "登录管理", icon: "🔐" },
];

// ========== Cron 预设 ==========
const CRON_PRESETS = [
  { label: "每5分钟", value: "*/5 * * * *" },
  { label: "每30分钟", value: "*/30 * * * *" },
  { label: "每小时", value: "0 * * * *" },
  { label: "每天9:00", value: "0 9 * * *" },
  { label: "每天9:00,15:00", value: "0 9,15 * * *" },
  { label: "每天午夜", value: "0 0 * * *" },
];

// ========== 工具函数 ==========
function formatTime(isoStr: string): string {
  try {
    return new Date(isoStr).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoStr;
  }
}

function formatFullTime(isoStr: string): string {
  try {
    return new Date(isoStr).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return isoStr;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * 主页面 - 闲鱼自动化助手控制台
 */
export default function HomePage() {
  // ========== 状态 ==========
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [availableTasks, setAvailableTasks] = useState<TaskItem[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [taskLogs, setTaskLogs] = useState<TaskLogEntry[]>([]);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [sessionValidating, setSessionValidating] = useState(false);
  const [sessionSaving, setSessionSaving] = useState(false);
  const [sessionCDPPort, setSessionCDPPort] = useState("9222");
  const [sessionCustomPath, setSessionCustomPath] = useState("");
  const [sessionImportPath, setSessionImportPath] = useState("");
  const [sessionImporting, setSessionImporting] = useState(false);

  // 模态框状态
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formScriptPath, setFormScriptPath] = useState("");
  const [formCron, setFormCron] = useState("");

  // Toast
  const toastIdRef = useRef(0);

  // ========== API 请求 ==========
  const apiFetch = useCallback(async <T,>(url: string, options?: RequestInit): Promise<T> => {
    const resp = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const json = await resp.json();
    if (!json.success) throw new Error(json.error || "请求失败");
    return json.data as T;
  }, []);

  // ========== Toast ==========
  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = ++toastIdRef.current;
    const toast = document.createElement("div");
    toast.id = `toast-${id}`;
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    const container = document.getElementById("toast-container");
    if (container) {
      container.appendChild(toast);
      setTimeout(() => {
        const el = document.getElementById(`toast-${id}`);
        el?.remove();
      }, 3000);
    }
  }, []);

  // ========== 数据加载 ==========
  const loadAvailableTasks = useCallback(async () => {
    try {
      const data = await apiFetch<TaskItem[]>("/api/tasks");
      setAvailableTasks(data);
    } catch (e) {
      console.error("加载任务失败:", e);
    }
  }, [apiFetch]);

  const loadScheduledTasks = useCallback(async () => {
    try {
      const data = await apiFetch<ScheduledTask[]>("/api/scheduled-tasks");
      setScheduledTasks(data);
    } catch (e) {
      console.error("加载定时任务失败:", e);
    }
  }, [apiFetch]);

  const loadLogs = useCallback(async () => {
    try {
      const data = await apiFetch<TaskLogEntry[]>("/api/logs");
      setTaskLogs(data);
    } catch (e) {
      console.error("加载日志失败:", e);
    }
  }, [apiFetch]);

  /** 加载登录态状态 */
  const loadSessionStatus = useCallback(async () => {
    try {
      const resp = await fetch("/api/session");
      const json = await resp.json();
      if (json.success) {
        setSessionStatus(json.data);
      }
    } catch (e) {
      console.error("加载登录态状态失败:", e);
    }
  }, []);

  // ========== 初始化 ==========
  useEffect(() => {
    loadAvailableTasks();
    loadScheduledTasks();
    loadLogs();
    loadSessionStatus();
  }, [loadAvailableTasks, loadScheduledTasks, loadLogs, loadSessionStatus]);

  // ========== SSE 实时更新 ==========
  useEffect(() => {
    const evtSource = new EventSource("/api/events");

    evtSource.addEventListener("task-complete", () => {
      loadLogs();
      loadScheduledTasks();
    });

    evtSource.addEventListener("task-triggered", (e: MessageEvent) => {
      try {
        const task = JSON.parse(e.data) as ScheduledTask;
        showToast(`⏰ 定时任务 "${task.name}" 已触发执行`, "info");
      } catch {
        /* ignore */
      }
    });

    evtSource.onerror = () => {
      setTimeout(() => {
        new EventSource("/api/events");
      }, 5000);
    };

    return () => evtSource.close();
  }, [loadLogs, loadScheduledTasks, showToast]);

  // ========== 任务操作 ==========
  const runTask = useCallback(
    async (scriptPath: string) => {
      try {
        const result = await apiFetch<TaskLogEntry>("/api/tasks/run", {
          method: "POST",
          body: JSON.stringify({ scriptPath }),
        });
        showToast(
          `${scriptPath.split("/").pop()} ${result.status === "success" ? "✅ 执行成功" : "❌ 执行失败"}`,
          result.status === "success" ? "success" : "error"
        );
        loadLogs();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "执行失败";
        showToast(`执行失败: ${msg}`, "error");
      }
    },
    [apiFetch, loadLogs, showToast]
  );

  const toggleTask = useCallback(
    async (taskId: string) => {
      try {
        await apiFetch(`/api/scheduled-tasks/${taskId}`, {
          method: "PUT",
          body: JSON.stringify({
            enabled: !scheduledTasks.find((t) => t.id === taskId)?.enabled,
          }),
        });
        loadScheduledTasks();
        showToast("任务状态已更新", "success");
      } catch (e: unknown) {
        showToast(`切换失败: ${e instanceof Error ? e.message : ""}`, "error");
      }
    },
    [apiFetch, loadScheduledTasks, scheduledTasks, showToast]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!confirm("确定要删除此定时任务吗？")) return;
      try {
        await apiFetch(`/api/scheduled-tasks/${taskId}`, { method: "DELETE" });
        loadScheduledTasks();
        showToast("定时任务已删除", "success");
      } catch (e: unknown) {
        showToast(`删除失败: ${e instanceof Error ? e.message : ""}`, "error");
      }
    },
    [apiFetch, loadScheduledTasks, showToast]
  );

  const clearLogs = useCallback(async () => {
    if (!confirm("确定要清空所有日志吗？")) return;
    try {
      await apiFetch("/api/logs", { method: "DELETE" });
      loadLogs();
      showToast("日志已清空", "success");
    } catch (e: unknown) {
      showToast(`清空失败: ${e instanceof Error ? e.message : ""}`, "error");
    }
  }, [apiFetch, loadLogs, showToast]);

  // ========== 模态框操作 ==========
  const openAddModal = useCallback(() => {
    setEditingTaskId(null);
    setFormName("");
    setFormScriptPath("");
    setFormCron("");
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((task: ScheduledTask) => {
    setEditingTaskId(task.id);
    setFormName(task.name);
    setFormScriptPath(task.scriptPath);
    setFormCron(task.cronExpression);
    setModalOpen(true);
  }, []);

  const openScheduleFromTask = useCallback((name: string, scriptPath: string) => {
    setEditingTaskId(null);
    setFormName(name);
    setFormScriptPath(scriptPath);
    setFormCron("0 9 * * *");
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const saveTask = useCallback(async () => {
    if (!formScriptPath) {
      showToast("请选择任务脚本", "error");
      return;
    }
    if (!formName.trim()) {
      showToast("请输入任务名称", "error");
      return;
    }
    if (!formCron.trim()) {
      showToast("请输入Cron表达式", "error");
      return;
    }
    try {
      if (editingTaskId) {
        await apiFetch(`/api/scheduled-tasks/${editingTaskId}`, {
          method: "PUT",
          body: JSON.stringify({
            name: formName.trim(),
            scriptPath: formScriptPath,
            cronExpression: formCron.trim(),
          }),
        });
        showToast("定时任务已更新", "success");
      } else {
        await apiFetch("/api/scheduled-tasks", {
          method: "POST",
          body: JSON.stringify({
            name: formName.trim(),
            scriptPath: formScriptPath,
            cronExpression: formCron.trim(),
          }),
        });
        showToast("定时任务已创建", "success");
      }
      closeModal();
      loadScheduledTasks();
    } catch (e: unknown) {
      showToast(`保存失败: ${e instanceof Error ? e.message : ""}`, "error");
    }
  }, [
    formScriptPath,
    formName,
    formCron,
    editingTaskId,
    apiFetch,
    closeModal,
    loadScheduledTasks,
    showToast,
  ]);

  // ========== 登录态操作 ==========

  /** 校验登录态是否有效 */
  const handleValidateSession = useCallback(async () => {
    setSessionValidating(true);
    try {
      const result = await apiFetch<ValidateResult>("/api/session", {
        method: "POST",
        body: JSON.stringify({ action: "validate" }),
      });
      showToast(result.valid ? "✅ " + result.message : "❌ " + result.message, result.valid ? "success" : "error");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "校验失败";
      showToast(`校验失败: ${msg}`, "error");
    } finally {
      setSessionValidating(false);
      loadSessionStatus();
    }
  }, [apiFetch, loadSessionStatus, showToast]);

  /** 保存登录态（启动浏览器） */
  const handleSaveSession = useCallback(async () => {
    setSessionSaving(true);
    try {
      const resp = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save" }),
      });
      const json = await resp.json();
      if (json.success) {
        showToast("🚀 浏览器已启动，请在闲鱼页面完成登录", "info");
        // 显示操作提示
        alert(
          "浏览器已自动打开到闲鱼首页。\n\n" +
          "请按以下步骤操作：\n" +
          "1. 在打开的浏览器中完成登录（扫码/密码/短信）\n" +
          "2. 确认登录成功后，在此页面点击「确认保存」按钮\n\n" +
          "注意：如果是通过 CDP 连接已有 Chrome，请确保已打开 --remote-debugging-port=9222"
        );
      } else {
        showToast(`启动浏览器失败: ${json.error || "未知错误"}`, "error");
      }
    } catch (e: unknown) {
      showToast(`保存失败: ${e instanceof Error ? e.message : ""}`, "error");
    } finally {
      setSessionSaving(false);
      loadSessionStatus();
    }
  }, [loadSessionStatus, showToast]);

  /** 通过 CDP 保存登录态 */
  const handleSaveSessionCDP = useCallback(async () => {
    setSessionSaving(true);
    try {
      const resp = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", port: parseInt(sessionCDPPort) }),
      });
      const json = await resp.json();
      if (json.success) {
        showToast("✅ 登录态已从 CDP 浏览器保存成功", "success");
      } else {
        showToast(`保存失败: ${json.error || "未知错误"}`, "error");
      }
    } catch (e: unknown) {
      showToast(`保存失败: ${e instanceof Error ? e.message : ""}`, "error");
    } finally {
      setSessionSaving(false);
      loadSessionStatus();
    }
  }, [apiFetch, loadSessionStatus, sessionCDPPort, showToast]);

  /** 清除登录态 */
  const handleClearSession = useCallback(async () => {
    if (!confirm("确定要清除已保存的登录态吗？\n\n清除后需要重新登录才能使用需要登录的自动化功能。")) return;
    try {
      await apiFetch("/api/session", { method: "DELETE" });
      showToast("✅ 登录态已清除", "success");
      loadSessionStatus();
    } catch (e: unknown) {
      showToast(`清除失败: ${e instanceof Error ? e.message : ""}`, "error");
    }
  }, [apiFetch, loadSessionStatus, showToast]);

  /** 导入已有的 storageState 文件 */
  const handleImportSession = useCallback(async () => {
    if (!sessionImportPath.trim()) {
      showToast("请先输入要导入的文件路径", "error");
      return;
    }
    setSessionImporting(true);
    try {
      const resp = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import", sourcePath: sessionImportPath.trim() }),
      });
      const json = await resp.json();
      if (json.success && json.data?.success) {
        const result = json.data;
        showToast(
          `✅ 导入成功！共 ${result.cookieCount} 个 Cookie，域名: ${(result.domains || []).join(", ")}`,
          "success"
        );
        loadSessionStatus();
      } else {
        showToast(`导入失败: ${json.data?.message || json.error || "未知错误"}`, "error");
      }
    } catch (e: unknown) {
      showToast(`导入失败: ${e instanceof Error ? e.message : ""}`, "error");
    } finally {
      setSessionImporting(false);
    }
  }, [sessionImportPath, loadSessionStatus, showToast]);

  /** 使用自定义文件路径查看状态 */
  const handleCheckCustomPath = useCallback(async () => {
    if (!sessionCustomPath.trim()) {
      showToast("请先输入要查看的文件路径", "error");
      return;
    }
    try {
      const queryPath = encodeURIComponent(sessionCustomPath.trim());
      const resp = await fetch(`/api/session?filePath=${queryPath}`);
      const json = await resp.json();
      if (json.success) {
        setSessionStatus(json.data);
        showToast("已切换到自定义文件路径查看状态", "info");
      } else {
        showToast(`查看失败: ${json.error || "未知错误"}`, "error");
      }
    } catch (e: unknown) {
      showToast(`查看失败: ${e instanceof Error ? e.message : ""}`, "error");
    }
  }, [sessionCustomPath, showToast]);

  // ========== 统计数据 ==========
  const stats = {
    total: availableTasks.length,
    scheduled: scheduledTasks.filter((t) => t.enabled).length,
    running: taskLogs.filter((l) => l.status === "running").length,
    todayLogs: taskLogs.filter(
      (l) => new Date(l.startTime).toDateString() === new Date().toDateString()
    ).length,
  };

  // ========== 渲染 ==========

  /** 渲染登录态状态指示器（侧边栏） */
  function renderSessionIndicator() {
    if (!sessionStatus) {
      return (
        <div className="sidebar-session">
          <div className="session-indicator checking">
            <span className="spinner-sm" />
            <span>检测中...</span>
          </div>
        </div>
      );
    }

    const isLoggedIn = sessionStatus.exists && sessionStatus.hasCookies && !sessionStatus.isExpired;

    return (
      <div className="sidebar-session" onClick={() => setActiveTab("session")} style={{ cursor: "pointer" }}>
        <div className={`session-indicator ${isLoggedIn ? "logged-in" : "logged-out"}`}>
          <span className="session-dot" />
          <span>{isLoggedIn ? "已登录" : "未登录"}</span>
          <span className="session-badge">
            {sessionStatus.exists ? `${sessionStatus.cookieCount} cookie` : "无"}
          </span>
        </div>
      </div>
    );
  }

  /** 渲染登录管理页面 */
  function renderSessionPage() {
    if (!sessionStatus) {
      return (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <span className="icon-big">🔍</span>
              <p>正在检测登录态状态...</p>
            </div>
          </div>
        </div>
      );
    }

    const isLoggedIn = sessionStatus.exists && sessionStatus.hasCookies;

    return (
      <>
        {/* 状态概览卡片 */}
        <div className="card">
          <div className="card-header">
            <h3>🔐 闲鱼登录态管理</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => { loadSessionStatus(); showToast("登录态状态已刷新", "info"); }}>
              🔄 刷新
            </button>
          </div>
          <div className="card-body">
            <div className="session-hero">
              <div className={`session-hero-icon ${isLoggedIn ? "success" : "danger"}`}>
                {isLoggedIn ? "✓" : "✗"}
              </div>
              <div className="session-hero-text">
                <div className="session-hero-title">
                  {isLoggedIn ? "登录状态正常" : "未检测到有效登录"}
                </div>
                <div className="session-hero-desc">
                  {isLoggedIn
                    ? "可以正常使用需要登录的自动化功能"
                    : "请先保存闲鱼登录态以启用完整功能"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 登录态详情 */}
        <div className="card">
          <div className="card-header">
            <h3>📋 登录态详情</h3>
          </div>
          <div className="card-body">
            <table className="session-detail-table">
              <tbody>
                <tr>
                  <td className="session-label">状态</td>
                  <td>
                    {isLoggedIn ? (
                      <span className="badge badge-success"><span className="dot" />有效</span>
                    ) : (
                      <span className="badge badge-danger"><span className="dot" />无效</span>
                    )}
                    {sessionStatus.isExpired && (
                      <span className="badge badge-warning" style={{ marginLeft: 8 }}><span className="dot" />部分 Cookie 已过期</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="session-label">Cookie 数量</td>
                  <td>{sessionStatus.cookieCount}</td>
                </tr>
                <tr>
                  <td className="session-label">文件大小</td>
                  <td>{formatFileSize(sessionStatus.fileSize)}</td>
                </tr>
                <tr>
                  <td className="session-label">文件路径</td>
                  <td><code className="session-code">{sessionStatus.filePath}</code></td>
                </tr>
                <tr>
                  <td className="session-label">最后修改</td>
                  <td>{sessionStatus.lastModified ? formatFullTime(sessionStatus.lastModified) : "-"}</td>
                </tr>
                {sessionStatus.domains.length > 0 && (
                  <tr>
                    <td className="session-label">Cookie 域名</td>
                    <td>
                      <div className="session-domains">
                        {sessionStatus.domains.map((domain) => (
                          <span key={domain} className="session-domain-tag">{domain}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 操作区域 */}
        <div className="card">
          <div className="card-header">
            <h3>🛠️ 操作</h3>
          </div>
          <div className="card-body">
            <div className="session-actions">
              {/* 操作按钮组 */}
              <div className="session-action-group">
                <div className="session-action-title">校验与刷新</div>
                <div className="session-action-buttons">
                  <button
                    className="btn btn-primary"
                    onClick={handleValidateSession}
                    disabled={sessionValidating || !isLoggedIn}
                  >
                    {sessionValidating ? <><span className="spinner" /> 校验中...</> : "🔍 校验登录态"}
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => { loadSessionStatus(); showToast("已刷新登录态状态", "info"); }}
                  >
                    🔄 刷新状态
                  </button>
                </div>
              </div>

              <div className="session-divider" />

              <div className="session-action-group">
                <div className="session-action-title">保存登录态</div>
                <div className="session-action-desc">
                  启动 Playwright 浏览器（或连接到已有 Chrome），在浏览器中完成闲鱼登录后保存登录态。
                </div>
                <div className="session-action-buttons">
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveSession}
                    disabled={sessionSaving}
                  >
                    {sessionSaving ? <><span className="spinner" /> 启动中...</> : "🚀 启动浏览器并登录"}
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      if (confirm(
                        "操作说明：\n\n" +
                        "1. 确保已启动 Chrome 并添加参数 --remote-debugging-port=9222\n" +
                        "2. 使用 start_chrome.bat 启动即可\n" +
                        "3. 在打开的 Chrome 中手动导航到闲鱼并登录\n" +
                        "4. 然后点击「从Chrome保存」按钮导出登录态\n\n" +
                        "确定已准备好？"
                      )) {
                        handleSaveSessionCDP();
                      }
                    }}
                    disabled={sessionSaving}
                  >
                    {sessionSaving ? <><span className="spinner" /> 保存中...</> : "🌐 从Chrome保存"}
                  </button>
                </div>
                {/* CDP 端口设置 */}
                <div className="session-cdp-config">
                  <label>CDP 端口：</label>
                  <input
                    className="form-control session-port-input"
                    type="number"
                    value={sessionCDPPort}
                    onChange={(e) => setSessionCDPPort(e.target.value)}
                    placeholder="9222"
                  />
                </div>
              </div>

              <div className="session-divider" />

              <div className="session-action-group">
                <div className="session-action-title">危险操作</div>
                <div className="session-action-buttons">
                  <button
                    className="btn btn-danger"
                    onClick={handleClearSession}
                    disabled={!isLoggedIn}
                  >
                    🗑️ 清除登录态
                  </button>
                </div>
              </div>

              <div className="session-divider" />

              {/* 自定义文件路径区域 */}
              <div className="session-action-group">
                <div className="session-action-title">📁 查看其他文件路径</div>
                <div className="session-action-desc">
                  输入自定义的 storageState 文件路径来查看其登录态状态信息。
                </div>
                <div className="session-cdp-config" style={{ flexWrap: "wrap" }}>
                  <input
                    className="form-control"
                    style={{ flex: 1, minWidth: 200 }}
                    type="text"
                    value={sessionCustomPath}
                    onChange={(e) => setSessionCustomPath(e.target.value)}
                    placeholder="输入完整的文件路径，如 D:\work\storage.json"
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleCheckCustomPath}
                    disabled={!sessionCustomPath.trim()}
                  >
                    🔍 查看状态
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setSessionCustomPath("");
                      loadSessionStatus();
                      showToast("已恢复到默认路径", "info");
                    }}
                  >
                    ↩ 恢复默认
                  </button>
                </div>
              </div>

              <div className="session-divider" />

              {/* 导入已有文件区域 */}
              <div className="session-action-group">
                <div className="session-action-title">📥 导入已有登录态文件</div>
                <div className="session-action-desc">
                  从其他路径导入已有的 Playwright storageState JSON 文件。文件会被复制到默认存储路径使用。
                </div>
                <div className="session-cdp-config" style={{ flexWrap: "wrap" }}>
                  <input
                    className="form-control"
                    style={{ flex: 1, minWidth: 200 }}
                    type="text"
                    value={sessionImportPath}
                    onChange={(e) => setSessionImportPath(e.target.value)}
                    placeholder="输入要导入的 storageState JSON 文件路径"
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleImportSession}
                    disabled={sessionImporting || !sessionImportPath.trim()}
                  >
                    {sessionImporting ? <><span className="spinner" /> 导入中...</> : "📥 导入并覆盖"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="card">
          <div className="card-header">
            <h3>📖 使用说明</h3>
          </div>
          <div className="card-body">
            <div className="session-help">
              <h4>如何保存登录态？</h4>
              <ol>
                <li><strong>方式一（推荐）：</strong>点击「启动浏览器并登录」，Playwright 会自动打开一个浏览器窗口并导航到闲鱼首页，你在浏览器中完成登录（扫码/密码/短信验证），然后在弹出的确认框中点击确定即可保存。</li>
                <li><strong>方式二（CDP）：</strong>先使用 <code>start_chrome.bat</code> 启动带有远程调试端口的 Chrome，手动导航到闲鱼并登录，然后点击「从Chrome保存」导出登录态。</li>
              </ol>

              <h4>如何验证登录态是否有效？</h4>
              <p>点击「校验登录态」按钮，系统会使用 Playwright 无头浏览器加载已保存的登录态并访问闲鱼首页，通过检测页面是否被重定向到登录页来判断登录态是否有效。</p>

              <h4>登录态失效怎么办？</h4>
              <p>闲鱼的登录态 Cookie 有效期有限，如果校验失败或被重定向到登录页，请重新执行保存登录态的流程。</p>

              <h4>安全提醒</h4>
              <p className="session-warning-text">⚠️ 登录态文件包含你的会话 Cookie，请勿分享或提交到 Git 仓库。项目已配置 .gitignore 自动排除。</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ========== 主渲染 ==========
  return (
    <div className="app-container">
      {/* ======== 侧边栏 ======== */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            ⚡ 闲鱼助手
            <span className="logo-badge">v2.0</span>
          </div>
          <div className="subtitle">自动化任务管理平台</div>
        </div>
        <nav className="nav-list">
          {TAB_CONFIG.map((tab) => (
            <div
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          ))}
        </nav>
        {renderSessionIndicator()}
        <div className="sidebar-footer">闲鱼自动化助手 v2.0 · 本地服务</div>
      </aside>

      {/* ======== 主内容区 ======== */}
      <main className="main-content">
        <header className="top-bar">
          <h2>{TAB_CONFIG.find((t) => t.id === activeTab)?.icon} {TAB_CONFIG.find((t) => t.id === activeTab)?.label}</h2>
          <div className="actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                loadAvailableTasks();
                loadScheduledTasks();
                loadLogs();
                loadSessionStatus();
                showToast("数据已刷新", "info");
              }}
            >
              🔄 刷新
            </button>
            {activeTab === "schedule" && (
              <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                ➕ 新建定时任务
              </button>
            )}
          </div>
        </header>

        <div className="page-content">
          {/* 控制台 */}
          {activeTab === "dashboard" && (
            <>
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">总任务数</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: "var(--success)" }}>
                    {stats.scheduled}
                  </div>
                  <div className="stat-label">定时任务</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: "var(--accent)" }}>
                    {stats.running}
                  </div>
                  <div className="stat-label">运行中</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ color: "var(--warning)" }}>
                    {stats.todayLogs}
                  </div>
                  <div className="stat-label">今日日志</div>
                </div>
              </div>

              {/* 任务列表 */}
              <div className="card">
                <div className="card-header">
                  <h3>📋 所有可用任务</h3>
                  <span className="text-sm text-muted">共 {availableTasks.length} 个任务</span>
                </div>
                <div className="card-body">
                  <div className="task-grid">
                    {availableTasks.length === 0 ? (
                      <div className="empty-state">
                        <span className="icon-big">📦</span>
                        <p>暂无可用任务</p>
                      </div>
                    ) : (
                      availableTasks.map((task) => (
                        <div key={task.path} className="task-card">
                          <div className="task-name">{task.name}</div>
                          <div className="task-path">{task.path}</div>
                          <div className="task-actions">
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => runTask(task.path)}
                            >
                              ▶ 立即运行
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => openScheduleFromTask(task.name, task.path)}
                            >
                              ⏰ 定时
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 最近的定时任务 */}
              <div className="card">
                <div className="card-header">
                  <h3>⏰ 最近的定时任务</h3>
                </div>
                <div className="card-body">
                  <table className="task-table">
                    <thead>
                      <tr>
                        <th>任务名称</th>
                        <th>执行周期</th>
                        <th>上次执行</th>
                        <th>下次执行</th>
                        <th>状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduledTasks.filter((t) => t.enabled).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="empty-cell">
                            暂无活跃的定时任务
                          </td>
                        </tr>
                      ) : (
                        scheduledTasks
                          .filter((t) => t.enabled)
                          .slice(0, 5)
                          .map((task) => (
                            <tr key={task.id}>
                              <td>
                                <strong>{task.name}</strong>
                              </td>
                              <td>
                                <code>{task.cronExpression}</code>
                              </td>
                              <td className="text-sm">
                                {task.lastRun ? formatTime(task.lastRun) : "-"}
                              </td>
                              <td className="text-sm">
                                {task.nextRun ? formatTime(task.nextRun) : "-"}
                              </td>
                              <td>
                                <span className="badge badge-success">
                                  <span className="dot" />
                                  活跃
                                </span>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* 定时任务 */}
          {activeTab === "schedule" && (
            <div className="card">
              <div className="card-header">
                <h3>⏰ 定时任务管理</h3>
                <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                  ➕ 新建定时任务
                </button>
              </div>
              <div className="card-body">
                <table className="task-table">
                  <thead>
                    <tr>
                      <th>启用</th>
                      <th>任务名称</th>
                      <th>脚本路径</th>
                      <th>执行周期</th>
                      <th>上次执行</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledTasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty-cell">
                          暂无定时任务，点击上方按钮创建
                        </td>
                      </tr>
                    ) : (
                      scheduledTasks.map((task) => (
                        <tr key={task.id}>
                          <td>
                            <label className="toggle">
                              <input
                                type="checkbox"
                                checked={task.enabled}
                                onChange={() => toggleTask(task.id)}
                              />
                              <span className="toggle-slider" />
                            </label>
                          </td>
                          <td>
                            <strong>{task.name}</strong>
                          </td>
                          <td>
                            <span className="text-sm text-muted font-mono">
                              {task.scriptPath}
                            </span>
                          </td>
                          <td>
                            <code>{task.cronExpression}</code>
                          </td>
                          <td className="text-sm text-muted">
                            {task.lastRun ? formatTime(task.lastRun) : "从未执行"}
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => runTask(task.scriptPath)}
                              >
                                ▶
                              </button>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => openEditModal(task)}
                              >
                                ✏️
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => deleteTask(task.id)}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 运行日志 */}
          {activeTab === "logs" && (
            <div className="card">
              <div className="card-header">
                <h3>📜 运行日志</h3>
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={loadLogs}>
                    🔄 刷新
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={clearLogs}>
                    🗑️ 清空日志
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div id="logContent" className="log-container">
                  {taskLogs.length === 0 ? (
                    <div className="log-entry">
                      <span className="log-time">[系统]</span>
                      <span className="log-info"> 暂无日志记录</span>
                    </div>
                  ) : (
                    taskLogs.map((log) => {
                      const time = formatTime(log.startTime);
                      let statusHtml: React.ReactNode;
                      if (log.status === "running")
                        statusHtml = <span className="log-warning">运行中</span>;
                      else if (log.status === "success")
                        statusHtml = <span className="log-success">✓ 成功</span>;
                      else if (log.status === "failed")
                        statusHtml = <span className="log-error">✗ 失败</span>;
                      else statusHtml = log.status;
                      const snippet = log.output
                        ? `<br><span style="padding-left:20px;font-size:12px;color:#565f89;">${log.output.slice(0, 200)}</span>`
                        : "";
                      return (
                        <div key={log.id} className="log-entry">
                          <span className="log-time">[{time}]</span>{" "}
                          <span>{log.scriptPath}</span> → {statusHtml}
                          <span dangerouslySetInnerHTML={{ __html: snippet }} />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 登录管理页面 */}
          {activeTab === "session" && renderSessionPage()}
        </div>
      </main>

      {/* ======== 模态框 ======== */}
      {modalOpen && (
        <div className="modal-overlay show" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editingTaskId ? "✏️ 编辑定时任务" : "⏰ 新建定时任务"}</h3>
              <button className="btn-icon" onClick={closeModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>
                  选择任务 <span className="required">*</span>
                </label>
                <select
                  className="form-control"
                  value={formScriptPath}
                  onChange={(e) => setFormScriptPath(e.target.value)}
                >
                  <option value="">请选择要定时执行的任务...</option>
                  {availableTasks.map((t) => (
                    <option key={t.path} value={t.path}>
                      {t.name} ({t.path})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  任务名称 <span className="required">*</span>
                </label>
                <input
                  className="form-control"
                  placeholder="例如：每日自动搜索"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>
                  执行周期 <span className="required">*</span>
                </label>
                <div className="cron-presets">
                  {CRON_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      className={`cron-preset ${formCron === preset.value ? "active" : ""}`}
                      onClick={() => setFormCron(preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input
                  className="form-control"
                  placeholder="Cron 表达式，例如：0 9 * * *"
                  value={formCron}
                  onChange={(e) => setFormCron(e.target.value)}
                />
                <div className="form-help">
                  Cron 格式: 分 时 日 月 周 (例如: 0 9 * * * 表示每天9点)
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal}>
                取消
              </button>
              <button className="btn btn-primary" onClick={saveTask}>
                {editingTaskId ? "更新任务" : "保存任务"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======== Toast 容器 ======== */}
      <div id="toast-container" className="toast-container" />
    </div>
  );
}
