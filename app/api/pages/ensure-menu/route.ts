import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { CMS_MENU_SEEDS } from '@/lib/cms-menu-seeds'
import { groupPagesBySlug, planMenuDedupes } from '@/lib/cms-menu-dedupe'

export const dynamic = 'force-dynamic'

const BATCH_LIMIT = 400

/**
 * Idempotent menu seed + dedupe:
 * 1. Soft-delete duplicate slug menu docs (migration race fix)
 * 2. Upsert seeds using slug as document ID (prevents concurrent double-create)
 */
export async function GET() {
  try {
    const db = getAdminDb()
    const pagesRef = db.collection('pages')
    const now = new Date()

    const allSnap = await pagesRef.get()
    const allDocs = allSnap.docs.map((d) => ({ id: d.id, ref: d.ref, data: d.data() }))
    const grouped = groupPagesBySlug(allDocs)
    const flat = [...grouped.values()].flat()
    const plans = planMenuDedupes(flat)

    const removed: Array<{ id: string; slug: string; reason: string }> = []
    const removedIds = new Set<string>()

    let batch = db.batch()
    let batchCount = 0

    const commitBatch = async () => {
      if (batchCount === 0) return
      await batch.commit()
      batch = db.batch()
      batchCount = 0
    }

    for (const plan of plans) {
      for (const id of plan.removeIds) {
        if (removedIds.has(id)) continue
        removedIds.add(id)
        batch.set(
          pagesRef.doc(id),
          sanitizeForFirestore({
            status: 'deleted',
            showInMenu: false,
            menuLocation: 'none',
            updatedAt: now,
          }),
          { merge: true }
        )
        batchCount++
        removed.push({ id, slug: plan.slug, reason: plan.reason })
        if (batchCount >= BATCH_LIMIT) await commitBatch()
      }
    }
    await commitBatch()

    let created = 0
    let updated = 0

    for (const seed of CMS_MENU_SEEDS) {
      const docRef = pagesRef.doc(seed.slug)
      const existing = await docRef.get()
      const payload = sanitizeForFirestore({
        slug: seed.slug,
        title: seed.title,
        description: seed.description || '',
        content: seed.content || '',
        seoTitle: seed.seoTitle || seed.title,
        seoDescription: seed.seoDescription || '',
        keywords: seed.keywords || [],
        status: seed.status,
        order: seed.order ?? seed.menuOrder ?? 0,
        menuLocation: seed.menuLocation,
        showInMenu: seed.showInMenu,
        menuLabel: seed.menuLabel || seed.title,
        menuOrder: seed.menuOrder ?? 0,
        headerSection: seed.headerSection || '',
        externalHref: seed.externalHref || '',
        updatedAt: now,
        ...(existing.exists ? {} : { createdAt: now }),
      })

      if (!existing.exists) {
        await docRef.set(payload, { merge: true })
        created++
      } else {
        const data = existing.data()
        if (data?.status === 'deleted' || !data?.showInMenu) {
          await docRef.set(payload, { merge: true })
          updated++
        }
      }
    }

    return NextResponse.json({
      success: true,
      deduped: removed.length,
      removed,
      created,
      updated,
    })
  } catch (error) {
    console.error('[v0] ensure-menu error:', error)
    return NextResponse.json({ success: false, error: 'Failed to ensure menu pages' }, { status: 500 })
  }
}
