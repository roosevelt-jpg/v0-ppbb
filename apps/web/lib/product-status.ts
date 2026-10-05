/**
 * Product catalog `status` is real metadata (gates Open links, readiness scores, audits).
 * Do not paint "shipped" on every row — when everything is ready, silence is the UX.
 * Only surface non-ready states (partial, deferred, planned, …).
 */
const READY = new Set(['shipped', 'shipped_e2e', 'ga', 'ready', 'live']);

export function isProductReady(status?: string | null): boolean {
  if (!status) return false;
  return READY.has(status.toLowerCase());
}

/** Null when status is the boring ready default — hide in UI. */
export function productStatusLabel(status?: string | null): string | null {
  if (!status) return null;
  if (isProductReady(status)) return null;
  return status;
}

/** Whether console Open → should show for this catalog row. */
export function canOpenProductConsole(status?: string | null, consolePath?: string | null): boolean {
  if (!consolePath) return false;
  if (!status) return true;
  const s = status.toLowerCase();
  return isProductReady(s) || s === 'partial';
}
