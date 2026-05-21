/**
 * 功能模块注册表 —— 每个自动化任务对应独立 Feature 页面（/features/[slug]）
 */

export interface FeatureDefinition {
  /** URL 段，如 get-shop-review-data */
  slug: string;
  name: string;
  scriptPath: string;
  description: string;
  category: "数据采集" | "搜索监控" | "聊天客服" | "发布管理" | "资源处理" | "飞书集成";
}

export const FEATURES: FeatureDefinition[] = [
  {
    slug: "get-shop-review-data",
    name: "每日搜索任务",
    scriptPath: "backend/tasks/get_shop_review_data.js",
    description: "采集店铺每日售出与运营数据。",
    category: "数据采集",
  },
  {
    slug: "get-shop-link-date-data",
    name: "每日链接数据更新",
    scriptPath: "backend/tasks/get_shop_link_date_data.js",
    description: "更新店铺链接的日期维度数据。",
    category: "数据采集",
  },
  {
    slug: "search-shop-links-by-keyword",
    name: "关键词搜索任务",
    scriptPath: "backend/tasks/search_shop_links_by_keyword.js",
    description: "按关键词搜索闲鱼商品并提取店铺链接。",
    category: "搜索监控",
  },
  {
    slug: "get-shop-links",
    name: "获取店铺链接",
    scriptPath: "backend/tasks/get_shop_links.js",
    description: "抓取指定店铺下的商品链接列表。",
    category: "搜索监控",
  },
  {
    slug: "auto-chat-link",
    name: "自动聊天链接",
    scriptPath: "backend/tasks/auto_chat_link.js",
    description: "自动处理买家聊天会话链接。",
    category: "聊天客服",
  },
  {
    slug: "auto-reply",
    name: "自动回复任务",
    scriptPath: "backend/tasks/auto_reply.js",
    description: "根据规则自动回复买家消息。",
    category: "聊天客服",
  },
  {
    slug: "publish-links",
    name: "自动发布任务",
    scriptPath: "backend/tasks/publish_links.js",
    description: "批量发布商品链接到闲鱼。",
    category: "发布管理",
  },
  {
    slug: "process-link-cozi",
    name: "资源处理任务",
    scriptPath: "backend/tasks/process_link_cozi.js",
    description: "处理链接中的资源内容。",
    category: "资源处理",
  },
  {
    slug: "process-image",
    name: "图片处理任务",
    scriptPath: "backend/tasks/process_image.js",
    description: "图片下载、裁剪与优化。",
    category: "资源处理",
  },
  {
    slug: "get-feishu-chat-links",
    name: "获取飞书聊天链接",
    scriptPath: "backend/tasks/get_feishu_chat_links.js",
    description: "从飞书会话获取聊天链接。",
    category: "飞书集成",
  },
];

export function getFeatureBySlug(slug: string): FeatureDefinition | undefined {
  return FEATURES.find((f) => f.slug === slug);
}

export function getFeatureByScriptPath(scriptPath: string): FeatureDefinition | undefined {
  return FEATURES.find((f) => f.scriptPath === scriptPath);
}

export function scriptPathToSlug(scriptPath: string): string {
  const base = scriptPath.split("/").pop()?.replace(/\.js$/i, "") ?? scriptPath;
  return base.replace(/_/g, "-");
}
