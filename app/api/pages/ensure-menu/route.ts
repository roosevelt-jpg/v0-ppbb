import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { CMS_MENU_SEEDS } from '@/lib/cms-menu-seeds'
import { sanitizeForFirestore } from '@/lib/firestore-utils'

export const dynamic = 'force-dynamic'

/** Idempotent: create default menu page records if missing (migrated from hardcoded footer/nav). */
export async function GET() {
  try {
    const db = getAdminDb()
    const pagesRef = db.collection('pages')
    const now = new Date()
    let created = 0

    for (const seed of CMS_MENU_SEEDS) {
      const existing = await pagesRef.where('slug', '==', seed.slug).limit(1).get()
      if (!existing.empty) continue

      await pagesRef.add(
        sanitizeForFirestore({
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
          createdAt: now,
          updatedAt: now,
        })
      )
      created++
    }

    return NextResponse.json({ success: true, created })
  } catch (error) {
    console.error('[v0] ensure-menu error:', error)
    return NextResponse.json({ success: false, error: 'Failed to ensure menu pages' }, { status: 500 })
  }
}
