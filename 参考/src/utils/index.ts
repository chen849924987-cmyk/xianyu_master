export { appConfig, DEFAULT_DOUDIAN_BASE_URL, storageStateExists } from "./config.js";
export {
  isLikelyFxgLoginWall,
  isPasswordLoginConfigured,
  performPasswordLogin,
} from "./doudian-password-login.js";
export {
  assertFxgLoggedInFromCurrentPage,
  isFxgLoggedInFromUrlAndTitle,
  openFeigeWorkspaceAndAssertLoggedIn,
  openWorkbenchAndAssertLoggedIn,
} from "./doudian-session.js";
export { attachFxgStorageStateAutosave, urlMatchesLoginSignal } from "./storage-state-autosave.js";
export { launchContext, saveStorageState, type LaunchResult } from "./browser.js";
export {
  detectSystemEdgeUserDataDir,
  getEdgeUserDataDir,
  launchEdgePersistentContext,
  resolveEdgeUserDataDir,
  type EdgeUserDataResolution,
  type LaunchEdgePersistentResult,
} from "./edge-persistent.js";
export { log } from "./logger.js";
export { writePageFailSnapshotFiles } from "./page-fail-snapshot.js";
