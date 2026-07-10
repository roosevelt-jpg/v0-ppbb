import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { slugifyFormTitle } from '@/lib/form-builder-utils'

export const dynamic = 'force-dynamic'

function serialize(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === 'object' && typeof (v as { toDate?: () => Date }).toDate === 'function') {
      out[k] = (v as { toDate: () => Date }).toDate().toISOString()
    } else {
      out[k] = v
    }
  }
  return out
}

async function findActiveFormBySlug(slug: string) {
  const db = getAdminDb()
  const snap = await db
    .collection('customForms')
    .where('slug', '==', slug)
    .where('status', '==', 'active')
    .limit(1)
    .get()
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...serialize(d.data()) }
}

/** Public read of active forms by slug (Admin SDK — no client Firestore read). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')?.trim()
    if (!slug) {
      return NextResponse.json({ success: false, error: 'slug required' }, { status: 400 })
    }

    const form = await findActiveFormBySlug(slug)
    if (!form) {
      return NextResponse.json({ success: true, data: null })
    }

    return NextResponse.json({ success: true, data: form })
  } catch (error) {
    console.error('[v0] /api/forms GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to load form' }, { status: 500 })
  }
}

/** Admin slug uniqueness check / generation helper */
export async function POST(request: Request) {
  try {
    const db = getAdminDb()
    const { title, excludeFormId } = await request.json()
    const base = slugifyFormTitle(title || '') || `form-${Date.now()}`
    let candidate = base
    let attempt = 0

    while (attempt < 50) {
      const snap = await db.collection('customForms').where('slug', '==', candidate).get()
      const collision = snap.docs.find((d) => d.id !== excludeFormId)
      if (!collision) {
        return NextResponse.json({ success: true, slug: candidate })
      }
      attempt += 1
      candidate = `${base}-${attempt}`
    }

    return NextResponse.json({ success: true, slug: `${base}-${Date.now()}` })
  } catch (error) {
    console.error('[v0] /api/forms POST slug error:', error)
    return NextResponse.json({ success: false, error: 'Failed to generate slug' }, { status: 500 })
  }
}
