/**
 * Deploy members.userId collectionGroup indexes + close remaining QA data gaps.
 * Uses the same robust credential parsing as the Next.js Admin SDK.
 *
 * Usage: npx tsx --env-file=.env.local scripts/complete-qa-ops.ts
 */
import { getAdminDb } from '../lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { getApp } from 'firebase-admin/app'

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

async function deployMembersIndex(projectId: string) {
  const app = getApp()
  const credential = app.options.credential
  if (!credential || typeof (credential as { getAccessToken?: unknown }).getAccessToken !== 'function') {
    throw new Error('Admin credential cannot mint access tokens')
  }
  const { access_token } = await (
    credential as { getAccessToken: () => Promise<{ access_token: string }> }
  ).getAccessToken()

  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)`
  const fieldName = `${base}/collectionGroups/members/fields/userId`
  const fieldBody = {
    indexConfig: {
      indexes: [
        { queryScope: 'COLLECTION', order: 'ASCENDING' },
        { queryScope: 'COLLECTION', order: 'DESCENDING' },
        { queryScope: 'COLLECTION_GROUP', order: 'ASCENDING' },
        { queryScope: 'COLLECTION_GROUP', order: 'DESCENDING' },
      ],
    },
  }

  const patchRes = await fetch(`${fieldName}?updateMask=indexConfig`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(fieldBody),
  })
  const patchJson = await patchRes.json().catch(() => ({}))
  console.log('[indexes] field patch', patchRes.status, JSON.stringify(patchJson).slice(0, 800))

  if (patchRes.ok) {
    console.log('[indexes] members.userId COLLECTION_GROUP indexes OK')
    return true
  }

  const createRes = await fetch(`${base}/collectionGroups/members/indexes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      queryScope: 'COLLECTION_GROUP',
      fields: [{ fieldPath: 'userId', order: 'ASCENDING' }],
    }),
  })
  const createJson = await createRes.json().catch(() => ({}))
  console.log('[indexes] create', createRes.status, JSON.stringify(createJson).slice(0, 800))
  const ok =
    createRes.ok ||
    createRes.status === 409 ||
    /ALREADY_EXISTS|already exists/i.test(JSON.stringify(createJson))
  console.log(ok ? '[indexes] members.userId index OK' : '[indexes] FAILED')
  return ok
}

async function ensureGuidelines(db: FirebaseFirestore.Firestore) {
  const pages = db.collection('pages')
  const bySlug = await pages.where('slug', '==', 'community-guidelines').limit(5).get()
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
  if (docRef && content.length > 80) {
    console.log('[cms] community-guidelines already has content')
    return
  }

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
    console.log('[cms] updated community-guidelines', docRef.id)
  } else {
    const created = await pages.add({ ...payload, createdAt: FieldValue.serverTimestamp() })
    console.log('[cms] created community-guidelines', created.id)
  }
}

async function fixLadiesNight(db: FirebaseFirestore.Firestore) {
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
    communities.find((c) => /passive\s*blessings|general|main/i.test(String(c.name || c.title || '')))

  let moved = 0
  for (const community of communities) {
    const groupsSnap = await db.collection('communities').doc(community.id).collection('groups').get()
    for (const g of groupsSnap.docs) {
      const name = String(g.data().name || g.data().title || '')
      if (!/ladies\s*night/i.test(name)) continue
      console.log(`[groups] found "${name}" under "${community.name || community.title || community.id}"`)
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
        console.log(`[groups] moved "${name}" → "${social.name || social.id}"`)
      }
    }
  }
  console.log('[groups] moved', moved)
}

async function scrubOffers(db: FirebaseFirestore.Firestore) {
  let cleaned = 0
  for (const name of ['businessOffers', 'offers', 'marketplaceOffers']) {
    let snap
    try {
      snap = await db.collection(name).limit(500).get()
    } catch {
      continue
    }
    for (const doc of snap.docs) {
      const data = doc.data()
      if (!isPlaceholderDescription(data.description || data.details || data.body)) continue
      await doc.ref.set(
        {
          description: '',
          updatedAt: FieldValue.serverTimestamp(),
          _scrubbedPlaceholderDescription: true,
        },
        { merge: true }
      )
      cleaned += 1
      console.log(`[marketplace] scrubbed ${name}/${doc.id}`)
    }
  }
  console.log('[marketplace] scrubbed', cleaned)
}

async function verifyMaps(db: FirebaseFirestore.Firestore) {
  const { resolveGooglePlacesApiKey } = await import('../lib/resolve-google-places-key')
  const key = await resolveGooglePlacesApiKey()
  console.log('[maps] resolveGooglePlacesApiKey:', key ? `present (${key.slice(0, 6)}…)` : 'MISSING')

  const loc = (await db.collection('admin').doc('locationConfig').get()).data() || {}
  console.log(
    '[maps] locationConfig keys set:',
    Boolean(loc.googlePlacesApiKey || loc.googleMapsApiKey)
  )
}

async function main() {
  const db = getAdminDb()
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    'unknown'
  console.log('[ops] project', projectId)

  await db.collection('_pb_health').doc('qa-ops').set(
    { ok: true, at: new Date().toISOString() },
    { merge: true }
  )
  console.log('[ops] Admin SDK connected')

  await verifyMaps(db)
  const indexOk = await deployMembersIndex(projectId)
  await ensureGuidelines(db)
  await fixLadiesNight(db)
  await scrubOffers(db)

  if (!indexOk) process.exitCode = 1
  console.log('[ops] done')
}

main().catch((err) => {
  console.error('[ops] FAILED', err?.message || err)
  process.exit(1)
})
