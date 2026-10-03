/**
 * Strip internal phase IDs (VL-###) from user-facing console copy.
 */
export function hidePhaseIds(text: string): string {
  return text
    .replace(/\s*\(VL-\d{3}(?:\s*[–—-]\s*(?:VL-)?\d{3})?\)/gi, '')
    .replace(/\bVL-\d{3}(?:\s*[–—-]\s*(?:VL-)?\d{3})?\b\.?\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/^[\s.—–-]+/, '')
    .trim();
}
