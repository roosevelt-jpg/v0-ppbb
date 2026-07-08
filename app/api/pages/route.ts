import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { auditFromApiRequest } from '@/lib/audit-log-server'
import { formatAdminRoleLabel } from '@/lib/audit-log-shared'

type AuditActor = {
  adminId: string
  adminEmail: string
  adminName: string
  adminRole: string
}

async function auditPageMutation(
  request: Request,
  actor: AuditActor | undefined,
  opts: {
    actionType: 'create' | 'update' | 'delete'
    pageId: string
    pageTitle: string
  }
) {
  if (!actor?.adminId) return
  await auditFromApiRequest(request, {
    adminId: actor.adminId,
    adminEmail: actor.adminEmail || 'unknown',
    adminName: actor.adminName || 'Unknown',
    adminRole: formatAdminRoleLabel(actor.adminRole || 'admin'),
    actionType: opts.actionType,
    action: `${opts.actionType === 'create' ? 'Created' : opts.actionType === 'update' ? 'Updated' : 'Deleted'} CMS page: ${opts.pageTitle}`,
    entityType: 'content',
    entityId: opts.pageId,
    entityName: opts.pageTitle,
    route: '/admin/pages',
    status: 'success',
  })
}

export const dynamic = 'force-dynamic'

/** Convert Firestore Admin Timestamps to ISO strings so the payload is plain JSON. */
function serialize(data: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === 'object' && typeof (v as any).toDate === 'function') {
      out[k] = (v as any).toDate().toISOString()
    } else {
      out[k] = v
    }
  }
  return out
}

/**
 * Public read of CMS pages via the Admin SDK (client-side reads of `pages`
 * are denied by deployed Firestore rules).
 *
 * Query params:
 *   - slug=<slug>            single published page by slug
 *   - menuLocation=<loc>     published pages shown in a given menu location
 *   - all=true               every page (admin listing, includes unpublished)
 *   - (none)                 all published pages
 */
export async function GET(request: Request) {
  try {
    const db = getAdminDb()
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    const menuLocation = searchParams.get('menuLocation')
    const all = searchParams.get('all') === 'true'

    const pagesRef = db.collection('pages')

    if (slug) {
      const snap = await pagesRef
        .where('slug', '==', slug)
        .where('status', '==', 'published')
        .get()
      if (snap.empty) {
        return NextResponse.json({ success: true, data: null })
      }
      const d = snap.docs[0]
      return NextResponse.json({ success: true, data: { id: d.id, ...serialize(d.data()) } })
    }

    if (menuLocation) {
      const snap = await pagesRef
        .where('status', '==', 'published')
        .where('menuLocation', '==', menuLocation)
        .where('showInMenu', '==', true)
        .get()
      const pages = snap.docs
        .map((d) => ({ id: d.id, ...serialize(d.data()) }))
        .sort((a: any, b: any) => (a.menuOrder || 0) - (b.menuOrder || 0))
      return NextResponse.json({ success: true, data: pages })
    }

    const snap = all
      ? await pagesRef.get()
      : await pagesRef.where('status', '==', 'published').get()
    const pages = snap.docs.map((d) => ({ id: d.id, ...serialize(d.data()) }))
    return NextResponse.json({ success: true, data: pages })
  } catch (error) {
    console.error('[v0] /api/pages GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load pages', data: [] },
      { status: 500 }
    )
  }
}

/**
 * Admin writes for CMS pages via the Admin SDK. Body: { action, payload }.
 * action: 'create' | 'update' | 'delete'
 */
export async function POST(request: Request) {
  try {
    const db = getAdminDb()
    const { action, payload, audit } = (await request.json()) as {
      action: string
      payload: Record<string, unknown>
      audit?: AuditActor
    }
    const pagesRef = db.collection('pages')
    const now = new Date()

    if (action === 'create') {
      const ref = await pagesRef.add(
        sanitizeForFirestore({ ...payload, createdAt: now, updatedAt: now })
      )
      const title = String(payload.title || payload.slug || 'Untitled')
      await auditPageMutation(request, audit, {
        actionType: 'create',
        pageId: ref.id,
        pageTitle: title,
      })
      return NextResponse.json({ success: true, id: ref.id })
    }

    if (action === 'update') {
      const { id, ...updates } = payload
      const pageId = String(id)
      await pagesRef.doc(pageId).set(sanitizeForFirestore({ ...updates, updatedAt: now }), { merge: true })
      const title = String(updates.title || updates.slug || pageId)
      await auditPageMutation(request, audit, {
        actionType: 'update',
        pageId,
        pageTitle: title,
      })
      return NextResponse.json({ success: true })
    }

    if (action === 'delete') {
      const pageId = String(payload.id)
      await pagesRef.doc(pageId).set(sanitizeForFirestore({ status: 'deleted', updatedAt: now }), { merge: true })
      await auditPageMutation(request, audit, {
        actionType: 'delete',
        pageId,
        pageTitle: pageId,
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[v0] /api/pages POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save page' }, { status: 500 })
  }
}
