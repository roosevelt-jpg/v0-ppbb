import type { DocumentReference } from 'firebase-admin/firestore'
import type { Page } from '@/lib/types'
import { getCmsPageHref } from '@/lib/cms-page-routes'

export function resolveMenuHref(page: Pick<Page, 'slug' | 'externalHref'>): string {
  return getCmsPageHref(page)
}

export type MenuPageDoc = {
  id: string
  ref: DocumentReference
  data: Record<string, unknown>
  slug: string
  href: string
  menuLocation: string
  createdAt: Date
}

function toDate(value: unknown): Date {
  if (value && typeof value === 'object' && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  if (typeof value === 'string') return new Date(value)
  return new Date(0)
}

/** Group published menu pages by slug — duplicates share identical slug values. */
export function groupPagesBySlug(
  docs: Array<{ id: string; ref: DocumentReference; data: Record<string, unknown> }>
): Map<string, MenuPageDoc[]> {
  const map = new Map<string, MenuPageDoc[]>()
  for (const doc of docs) {
    const slug = String(doc.data.slug || '').trim()
    if (!slug) continue
    const entry: MenuPageDoc = {
      id: doc.id,
      ref: doc.ref,
      data: doc.data,
      slug,
      href: resolveMenuHref({
        slug,
        externalHref: doc.data.externalHref as string | undefined,
      }),
      menuLocation: String(doc.data.menuLocation || ''),
      createdAt: toDate(doc.data.createdAt),
    }
    const list = map.get(slug) || []
    list.push(entry)
    map.set(slug, list)
  }
  return map
}

export interface MenuDedupePlan {
  keepId: string
  removeIds: string[]
  slug: string
  href: string
  menuLocation: string
  reason: string
}

/**
 * Plan removal of redundant docs with the same slug (migration race duplicates).
 * Legitimately distinct slugs sharing one href (e.g. Join + Volunteer → /signup) are kept.
 */
export function planMenuDedupes(docs: MenuPageDoc[]): MenuDedupePlan[] {
  const plans: MenuDedupePlan[] = []

  const bySlug = new Map<string, MenuPageDoc[]>()
  for (const d of docs) {
    if (d.data.status !== 'published' || d.data.showInMenu !== true) continue
    const list = bySlug.get(d.slug) || []
    list.push(d)
    bySlug.set(d.slug, list)
  }

  for (const [slug, list] of bySlug) {
    if (list.length <= 1) continue
    const sorted = [...list].sort((a, b) => {
      const aCanonical = a.id === a.slug ? 0 : 1
      const bCanonical = b.id === b.slug ? 0 : 1
      if (aCanonical !== bCanonical) return aCanonical - bCanonical
      return a.createdAt.getTime() - b.createdAt.getTime()
    })
    const keep = sorted[0]
    const remove = sorted.slice(1)
    plans.push({
      keepId: keep.id,
      removeIds: remove.map((r) => r.id),
      slug,
      href: keep.href,
      menuLocation: keep.menuLocation,
      reason: 'duplicate_slug_race',
    })
  }

  return plans
}
