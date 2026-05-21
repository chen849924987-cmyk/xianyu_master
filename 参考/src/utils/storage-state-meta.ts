import fs from "node:fs";
import { appConfig } from "./config.js";

export type StorageStateMeta = {
  path: string;
  exists: boolean;
  validJson: boolean;
  size: number | null;
  parseError?: string;
};

/** 供 UI / server 体检 storage-state，不与 Playwright 耦合 */
export function getStorageStateMeta(): StorageStateMeta {
  const filePath = appConfig.storageStatePath;
  try {
    const st = fs.statSync(filePath);
    if (!st.isFile()) {
      return { path: filePath, exists: false, validJson: false, size: null };
    }
    const raw = fs.readFileSync(filePath, "utf8");
    try {
      JSON.parse(raw);
      return { path: filePath, exists: true, validJson: true, size: st.size };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        path: filePath,
        exists: true,
        validJson: false,
        size: st.size,
        parseError: msg,
      };
    }
  } catch {
    return { path: filePath, exists: false, validJson: false, size: null };
  }
}
