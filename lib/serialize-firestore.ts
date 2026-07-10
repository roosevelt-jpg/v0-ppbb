/** Convert Firestore Admin / client timestamps to ISO strings for JSON APIs. */
export function serializeFirestoreValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString()
    } catch {
      return null
    }
  }
  // DocumentReference / GeoPoint-ish — avoid circular JSON crashes
  if (
    typeof value === 'object' &&
    value !== null &&
    'path' in value &&
    typeof (value as { path?: unknown }).path === 'string' &&
    'firestore' in value
  ) {
    return (value as { path: string }).path
  }
  if (Array.isArray(value)) {
    return value.map(serializeFirestoreValue)
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = serializeFirestoreValue(val)
    }
    return out
  }
  return value
}

export function serializeFirestoreDoc<T extends Record<string, unknown>>(id: string, data: T) {
  return { id, ...serializeFirestoreValue(data) as T }
}
