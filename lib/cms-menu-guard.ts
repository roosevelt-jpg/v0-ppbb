import type { Firestore } from 'firebase-admin/firestore'

/** Block duplicate slug — the root cause of menu migration races. */
export async function findConflictingPageSlug(
  db: Firestore,
  opts: {
    slug: string
    excludeId?: string
  }
): Promise<{ id: string; slug: string } | null> {
  const slug = opts.slug.trim()
  if (!slug) return null

  const byField = await db.collection('pages').where('slug', '==', slug).get()
  for (const doc of byField.docs) {
    if (opts.excludeId && doc.id === opts.excludeId) continue
    if (doc.data().status === 'deleted') continue
    return { id: doc.id, slug }
  }

  const byDocId = await db.collection('pages').doc(slug).get()
  if (byDocId.exists && (!opts.excludeId || byDocId.id !== opts.excludeId)) {
    if (byDocId.data()?.status !== 'deleted') {
      return { id: byDocId.id, slug }
    }
  }

  return null
}

export function slugConflictMessage(slug: string): string {
  return `A page with slug "${slug}" already exists. Use a unique slug or edit the existing page instead of creating a duplicate menu entry.`
}
