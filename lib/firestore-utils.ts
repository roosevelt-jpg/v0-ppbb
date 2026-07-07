/**
 * Strip undefined values before writing to Firestore.
 * Firestore rejects documents that contain undefined fields.
 */
export function sanitizeForFirestore<T extends Record<string, unknown>>(data: T): T {
  const result = {} as T
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key as keyof T] = sanitizeForFirestore(value as Record<string, unknown>) as T[keyof T]
    } else if (Array.isArray(value)) {
      result[key as keyof T] = value.map((item) =>
        item !== null && typeof item === 'object' && !(item instanceof Date)
          ? sanitizeForFirestore(item as Record<string, unknown>)
          : item
      ) as T[keyof T]
    } else {
      result[key as keyof T] = value as T[keyof T]
    }
  }
  return result
}
