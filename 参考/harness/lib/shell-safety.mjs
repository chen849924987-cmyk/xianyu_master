/**
 * Shell / Shell 工具安全策略：返回 Cursor hook 所需字段
 */

const DENY = (user, agent) => ({
  permission: "deny",
  user_message: user,
  agent_message: agent,
});

const ASK = (user, agent) => ({
  permission: "ask",
  user_message: user,
  agent_message: agent,
});

/** 归一化：去首尾空白、折叠空白，便于匹配 */
function normCmd(cmd) {
  return String(cmd || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * @param {string} command
 * @returns {{ permission: string, user_message?: string, agent_message?: string }}
 */
export function auditShellCommand(command) {
  const raw = String(command || "");
  const c = normCmd(raw);

  if (!c) return { permission: "allow" };

  // 递归炸弹类
  if (/\(\)\s*\{\s*:\s*\|\s*:\s*&&\s*:\s*;\s*\}\s*;?\s*:/.test(c) || /:\(\)\s*\{/.test(c)) {
    return DENY("已拦截疑似 fork bomb 片段。", "请勿执行 fork bomb 或类似构造。");
  }

  // 危险块设备 / 格式化
  if (/\bdd\s+if=/.test(c) || /\bmkfs\b/.test(c) || />\s*\/dev\/[sh]d/.test(c)) {
    return DENY("已拦截可能对磁盘/设备造成破坏的命令。", "请改用安全方式操作数据。");
  }

  // 根目录 / 家目录大范围删除
  if (/\brm\s+(-[a-z]*rf?|-[a-z]*fr?)\s+/.test(c)) {
    if (/\s\/\s*$/.test(c) || /\s\/\*?\s*$/.test(c) || /\s~\s*$/.test(c) || /\s\$home\s*$/i.test(c)) {
      return DENY("已拦截对根目录/家目录的 rm -rf。", "请缩小删除范围，避免 rm -rf / 或 ~。");
    }
  }

  // 全局 chmod
  if (/\bchmod\s+(-[a-z]+\s+)?777\s+\//.test(c) || /\bchmod\s+777\s+\/\s*$/.test(c)) {
    return DENY("已拦截对根目录的 chmod 777。", "请改为具体目录权限。");
  }

  // 强制推送（可改为 allow，看团队习惯）
  if (/\bgit\s+push\b/.test(c) && (/--force\b/.test(c) || /-f\b/.test(c))) {
    return ASK(
      "检测到 git push --force，需在客户端确认是否继续。",
      "若确需 force push，请让用户在 Cursor 中批准；否则请改用普通 push。",
    );
  }

  // curl/wget 带典型鉴权头（易泄密）
  if (/\b(curl|wget)\b/.test(c) && /(-h|--header)\s+['"]?authorization[:=]/i.test(raw)) {
    return ASK(
      "检测到在命令行中传入 Authorization 头，存在密钥泄露风险。",
      "请改用环境变量或配置文件，并避免把 token 写进终端历史。",
    );
  }

  return { permission: "allow" };
}
