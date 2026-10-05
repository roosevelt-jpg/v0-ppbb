/**
 * Product catalog `status` is real metadata (gates Open links, readiness scores, audits).
 * Never paint "shipped" / "shipped_e2e" in the console — ready is silent.
 * Only surface non-ready states (partial, deferred, planned, …).
 */
const READY = new Set([
  'shipped',
  'shipped_e2e',
  'ga',
  'ready',
  'live',
  'available',
  'active',
  'ok',
  'wired',
]);

export function isProductReady(status?: string | null): boolean {
  if (!status) return false;
  return READY.has(status.toLowerCase().replace(/\s+/g, '_'));
}

/** Null when status is the boring ready default — hide in UI. Never returns the word "shipped". */
export function productStatusLabel(status?: string | null): string | null {
  if (!status) return null;
  const raw = status.trim();
  const normalized = raw.toLowerCase().replace(/\s+/g, '_');
  if (isProductReady(normalized)) return null;
  if (normalized.includes('shipped')) return null;
  return raw;
}

/** Strip "shipped" wording from free-form chip / score copy. */
export function scrubShippedCopy(text: string): string {
  return text
    .replace(/\bshipped[_\s-]*e2e\b/gi, 'ready')
    .replace(/\bshipped\b/gi, 'ready')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Whether console Open → should show for this catalog row. */
export function canOpenProductConsole(status?: string | null, consolePath?: string | null): boolean {
  if (!consolePath) return false;
  if (!status) return true;
  const s = status.toLowerCase().replace(/\s+/g, '_');
  return isProductReady(s) || s === 'partial';
}
