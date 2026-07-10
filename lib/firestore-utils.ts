/**
 * Strip undefined values before writing to Firestore.
 * Firestore rejects documents that contain undefined fields.
 * Preserves Date, FieldValue sentinels, Timestamp, and other non-plain objects.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  if (Array.isArray(value)) return false
  if (value instanceof Date) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

export function sanitizeForFirestore<T extends Record<string, unknown>>(data: T): T {
  const result = {} as T
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    if (isPlainObject(value)) {
      result[key as keyof T] = sanitizeForFirestore(value) as T[keyof T]
    } else if (Array.isArray(value)) {
      result[key as keyof T] = value.map((item) =>
        isPlainObject(item) ? sanitizeForFirestore(item) : item
      ) as T[keyof T]
    } else {
      result[key as keyof T] = value as T[keyof T]
    }
  }
  return result
}
