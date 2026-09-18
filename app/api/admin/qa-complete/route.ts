import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { tryResolveAdminUid } from '@/lib/audit-api-helper'
import { resolveGooglePlacesApiKey } from '@/lib/resolve-google-places-key'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GUIDELINES_HTML = `
<h2>Our standards</h2>
<p>Passive Blessings is a respectful community. Treat every member with dignity, whether you meet online or in person.</p>
<h2>Be kind and inclusive</h2>
<p>No harassment, hate speech, discrimination, or bullying. We welcome people of all backgrounds who share our values of service and mutual support.</p>
<h2>Keep it safe</h2>
<p>Do not share private information about others without consent. Report safety concerns to the Passive Blessings team promptly.</p>
<h2>Participate honestly</h2>
<p>Be truthful in profiles, applications, and charity or volunteer requests. Misrepresentation may lead to removal from the platform.</p>
<h2>Events and volunteering</h2>
<p>Show up when you register. If you cannot attend, cancel in advance so others can take your place.</p>
<h2>Consequences</h2>
<p>Violations may result in warnings, restricted access, or permanent removal.</p>
`.trim()

function isPlaceholderDescription(html: unknown) {
  const text = String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return /^(\d+\s*){2,}$/.test(text)
}

/**
 * POST /api/admin/qa-complete
 * Admin-only: seed guidelines, scrub placeholder marketplace copy, optionally re-parent Ladies Night.
 * Also reports whether Google Maps key resolves from Integrations.
 */
export async function POST(request: NextRequest) {
  try {
    const adminUid = await tryResolveAdminUid(request)
    if (!adminUid) {
      return NextResponse.json({ success: false, error: 'Admin authorization required' }, { status: 401 })
    }

    const db = getAdminDb()
    const report: Record<string, unknown> = { adminUid }

    const mapsKey = await resolveGooglePlacesApiKey()
    report.mapsKeyConfigured = Boolean(mapsKey)

    // Community guidelines
    const pages = db.collection('pages')
    const bySlug = await pages.where('slug', '==', 'community-guidelines').limit(3).get()
    let docRef = bySlug.docs[0]?.ref
    let data = bySlug.docs[0]?.data() || {}
    if (!docRef) {
      const snap = await pages.limit(200).get()
      const hit = snap.docs.find((d) =>
        String(d.data().slug || '')
          .toLowerCase()
          .includes('community-guideline')
      )
      docRef = hit?.ref
      data = hit?.data() || {}
    }
    const content = String(data.content || data.body || data.html || '').trim()
    if (!docRef || content.length <= 80) {
      const payload = {
        title: data.title || 'Community Guidelines',
        slug: 'community-guidelines',
        content: GUIDELINES_HTML,
        status: data.status || 'published',
        showInMenu: data.showInMenu !== false,
        updatedAt: FieldValue.serverTimestamp(),
      }
      if (docRef) {
        await docRef.set(payload, { merge: true })
        report.guidelines = `updated:${docRef.id}`
      } else {
        const created = await pages.add({ ...payload, createdAt: FieldValue.serverTimestamp() })
        report.guidelines = `created:${created.id}`
      }
    } else {
      report.guidelines = 'already-populated'
    }

    // Scrub placeholder marketplace descriptions
    let scrubbed = 0
    for (const name of ['businessOffers', 'offers', 'marketplaceOffers']) {
      let snap
      try {
        snap = await db.collection(name).limit(500).get()
      } catch {
        continue
      }
      for (const doc of snap.docs) {
        const row = doc.data()
        if (!isPlaceholderDescription(row.description || row.details || row.body)) continue
        await doc.ref.set(
          {
            description: '',
            updatedAt: FieldValue.serverTimestamp(),
            _scrubbedPlaceholderDescription: true,
          },
          { merge: true }
        )
        scrubbed += 1
      }
    }
    report.marketplaceScrubbed = scrubbed

    // Ladies Night re-parent (only Tech Startup → social/ladies community)
    const communitiesSnap = await db.collection('communities').get()
    const communities = communitiesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
      id: string
      name?: string
      title?: string
    }>
    const tech = communities.find((c) => /tech\s*startup|startup/i.test(String(c.name || c.title || '')))
    const social =
      communities.find((c) =>
        /ladies|women|social|wellness|community\s*hub/i.test(String(c.name || c.title || ''))
      ) ||
      communities.find((c) =>
        /passive\s*blessings|general|main/i.test(String(c.name || c.title || ''))
      )

    let moved = 0
    const found: string[] = []
    for (const community of communities) {
      const groupsSnap = await db.collection('communities').doc(community.id).collection('groups').get()
      for (const g of groupsSnap.docs) {
        const name = String(g.data().name || g.data().title || '')
        if (!/ladies\s*night/i.test(name)) continue
        found.push(`${name} @ ${community.name || community.id}`)
        if (tech && community.id === tech.id && social && social.id !== tech.id) {
          await db
            .collection('communities')
            .doc(social.id)
            .collection('groups')
            .doc(g.id)
            .set(
              {
                ...g.data(),
                communityId: social.id,
                updatedAt: FieldValue.serverTimestamp(),
                _reparentedFrom: community.id,
              },
              { merge: true }
            )
          await g.ref.delete()
          moved += 1
        }
      }
    }
    report.ladiesNightFound = found
    report.ladiesNightMoved = moved

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error('[admin/qa-complete]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'QA complete failed' },
      { status: 500 }
    )
  }
}
