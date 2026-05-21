#!/usr/bin/env node
/**
 * afterFileEdit：AI 修改代码时，提醒遵循对应模块的代码规范
 * stdin: { file_path, edits? }
 * stdout: { reminder?: string, standards_files?: string[] }
 */
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function detectModuleType(filePath) {
  const normalized = filePath.replace(/\\/g, "/");

  // 测试代码
  if (normalized.includes("/tests/") || normalized.includes("\\tests\\")) {
    return {
      type: "test",
      section: "test",
      title: "测试代码规范",
      keyFiles: ["naming.md", "structure.md", "assertions.md"],
      patterns: ["tests/mcp 文档与 verify-offline.ts", "MCP 实录纪律", "环境变量控制"],
    };
  }

  // 前端代码
  if (normalized.includes("/web/src/") || normalized.includes("\\web\\src\\")) {
    return {
      type: "frontend",
      section: "frontend",
      title: "前端代码规范",
      keyFiles: ["react-components.md", "tailwind-css.md", "ui-components.md"],
      patterns: ["React 函数组件", "@/ 别名导入", "Tailwind 类名顺序", "shadcn/ui 组件"],
    };
  }

  // 后端 API
  if (normalized.includes("/src/server/") || normalized.includes("\\src\\server\\")) {
    return {
      type: "backend",
      section: "backend",
      title: "后端代码规范",
      keyFiles: ["api-response.md", "types.md", "routes.md"],
      patterns: ["Express API 响应格式", "类型定义", "进程管理", "SSE 规范"],
    };
  }

  // 脚本/功能模块
  if (normalized.includes("/src/features/") || normalized.includes("\\src\\features\\") ||
      normalized.includes("/src/utils/") || normalized.includes("\\src\\utils\\") ||
      normalized.includes("/src/cli.ts")) {
    return {
      type: "script",
      section: "script",
      title: "脚本代码规范",
      keyFiles: ["feature-module.md", "logging.md", "selectors.md"],
      patterns: ["FeatureModule 结构", "日志 [feature-id] 前缀", "Playwright 选择器"],
    };
  }

  // 通用 TypeScript/JavaScript
  if (/\.(ts|tsx|js|mjs|jsx)$/.test(normalized)) {
    return {
      type: "general",
      section: "general",
      title: "通用代码规范",
      keyFiles: ["naming.md", "imports.md", "commits.md"],
      patterns: ["命名规范", "导入顺序", "注释规范", "提交规范"],
    };
  }

  return null;
}

function getStandardsFiles(root, section, keyFiles) {
  const docsDir = resolve(root, "docs");
  const sectionDir = resolve(docsDir, section);

  return {
    guide: resolve(docsDir, "CODING_GUIDE.md"),
    sectionReadme: resolve(sectionDir, "README.md"),
    keyFiles: keyFiles.map((f) => resolve(sectionDir, f)),
    general: resolve(docsDir, "general", "README.md"),
  };
}

function main() {
  let data = {};
  try {
    data = JSON.parse(readStdin() || "{}");
  } catch {
    /* ignore */
  }

  const filePath = typeof data.file_path === "string" ? data.file_path : "";
  if (!filePath) {
    console.log(JSON.stringify({}));
    return;
  }

  const moduleInfo = detectModuleType(filePath);
  if (!moduleInfo) {
    console.log(JSON.stringify({}));
    return;
  }

  // 计算项目根目录
  let root = process.cwd();
  if (filePath.includes("/src/") || filePath.includes("\\src\\")) {
    const srcIdx = filePath.replace(/\\/g, "/").indexOf("/src/");
    if (srcIdx > 0) {
      root = filePath.slice(0, srcIdx);
    }
  } else if (filePath.includes("/web/") || filePath.includes("\\web\\")) {
    const webIdx = filePath.replace(/\\/g, "/").indexOf("/web/");
    if (webIdx > 0) {
      root = filePath.slice(0, webIdx);
    }
  } else if (filePath.includes("/tests/") || filePath.includes("\\tests\\")) {
    const testsIdx = filePath.replace(/\\/g, "/").indexOf("/tests/");
    if (testsIdx > 0) {
      root = filePath.slice(0, testsIdx);
    }
  }

  const files = getStandardsFiles(root, moduleInfo.section, moduleInfo.keyFiles);
  const relPath = relative(root, filePath).replace(/\\/g, "/");

  const keyFilesStr = moduleInfo.keyFiles.map((f) => `docs/${moduleInfo.section}/${f}`).join("\n• ");

  const reminder = `📋 代码规范提醒

你正在修改「${moduleInfo.type === "frontend" ? "前端" : moduleInfo.type === "backend" ? "后端 API" : moduleInfo.type === "test" ? "测试" : moduleInfo.type === "script" ? "脚本/功能" : "TypeScript"}」模块的文件：${relPath}

请遵循以下规范：
• docs/${moduleInfo.section}/README.md → ${moduleInfo.title}
• 关键要点：${moduleInfo.patterns.join("、")}

重点规范文件：
• ${keyFilesStr}

完整规范位置：
• 入口指南：docs/CODING_GUIDE.md
• 本模块目录：docs/${moduleInfo.section}/
• 通用规范：docs/general/
• MCP 验证：.cursor/rules/local-mcp-validation.mdc（浏览器自动化时）`;

  const output = {
    reminder,
    guide_file: files.guide,
    section_readme: files.sectionReadme,
    key_files: files.keyFiles,
    general_readme: files.general,
    module_type: moduleInfo.type,
    module_section: moduleInfo.section,
    target_file: relPath,
  };

  console.log(JSON.stringify(output, null, 2));
}

main();
