import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 从任意 `import.meta.url` 向上查找含 `package.json` 的仓库根（供 tests 内 import `dist/`）。
 */
export function resolveRepoRoot(importMetaUrl: string): string {
  let dir = path.dirname(fileURLToPath(importMetaUrl));
  for (let i = 0; i < 8; i++) {
    const marker = path.join(dir, "package.json");
    if (fs.existsSync(marker)) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  throw new Error("resolveRepoRoot: package.json not found when walking up from import.meta.url");
}
