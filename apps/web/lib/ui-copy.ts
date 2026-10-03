/**
 * Strip internal phase IDs (VL-###) from user-facing console copy.
 */
export function hidePhaseIds(text: string): string {
  return text
    .replace(/\s*\(VL-\d{3}(?:\s*[–—-]\s*(?:VL-)?\d{3})?\)/gi, '')
    .replace(/\bVL-\d{3}(?:\s*[–—-]\s*(?:VL-)?\d{3})?\b\.?\s*/gi, '')
    .replace(/\(Phase\s+(\d+)\s*\/\s*\)/gi, '(Phase $1)')
    .replace(/\s*\/\s*[–—-]/g, ' —')
    .replace(/[–—-]\s*[–—-]/g, '—')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/^[\s.—–-]+/, '')
    .replace(/\s+[–—-]\s*$/g, '')
    .replace(/\bfrom\s*$/i, '')
    .trim();
}

/** Scrub note/notes/description fields on API payloads before console render. */
export function hidePhaseIdsInCopyFields<T>(value: T): T {
  if (typeof value === 'string') return hidePhaseIds(value) as T;
  if (Array.isArray(value)) return value.map((v) => hidePhaseIdsInCopyFields(v)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (
        typeof v === 'string' &&
        /^(note|notes|description|summary|title|message|disclaimer)$/i.test(k)
      ) {
        out[k] = hidePhaseIds(v);
      } else if (v && typeof v === 'object') {
        out[k] = hidePhaseIdsInCopyFields(v);
      } else {
        out[k] = v;
      }
    }
    return out as T;
  }
  return value;
}
