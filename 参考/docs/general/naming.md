# 命名规范

## 文件与目录

| 类型 | 规范 | 示例 |
|------|------|------|
| 普通文件 | 小写 + 连字符 | `feature-run-history.ts`, `doudian-session.ts` |
| 目录 | 小写 + 连字符 | `src/features/`, `src/utils/` |
| React 组件文件 | PascalCase | `HookUsageCharts.tsx`, `AdminShell.tsx` |

## 代码命名

| 类型 | 规范 | 示例 |
|------|------|------|
| 类型/接口 | PascalCase | `FeatureModule`, `FeatureRunContext` |
| 函数 | camelCase | `launchContext()`, `saveStorageState()` |
| 变量 | camelCase | `storageStatePath`, `isLoading` |
| 常量 | SCREAMING_SNAKE_CASE | `DEFAULT_DOUDIAN_BASE_URL`, `RECENT_RUNS_LIMIT` |
| React 组件 | PascalCase | `function HooksPage()` |
| 私有方法 | _camelCase（可选） | `_privateMethod()` |
| 枚举 | PascalCase | `enum JobStatus { Running, Completed }` |
| 泛型参数 | T, K, V 或描述性 | `T`, `TData`, `TResult` |

## 命名示例

```typescript
// ✅ 好的命名
const DEFAULT_TIMEOUT_MS = 30_000;
const storageStatePath = path.join(root, ".data", "storage-state.json");

export type FeatureModule = {
  id: string;
  displayName: string;
  run: (ctx: FeatureRunContext) => Promise<void>;
};

export async function launchBrowserContext(): Promise<LaunchResult> {
  // ...
}

// React 组件
export function SessionPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  return <div />;
}

// ❌ 避免的命名
const default_timeout = 30000;  // 应为 DEFAULT_TIMEOUT_MS
const storagepath = "...";       // 应为 storageStatePath
function launchbrowser() {}      // 应为 launchBrowserContext
function Session_page() {}       // 应为 SessionPage
```
