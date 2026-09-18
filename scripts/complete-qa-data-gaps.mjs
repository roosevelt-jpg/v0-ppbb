/**
 * Close remaining QA data gaps via Admin SDK.
 * Usage: node --env-file=.env.local scripts/complete-qa-data-gaps.mjs
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL

function credentialsFromEnv() {
  if (projectId && privateKey && clientEmail) {
    return { projectId, privateKey, clientEmail }
  }
  const raw = process.env.GCP_SERVICE_ACCOUNT
  if (!raw) return null
  try {
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'))
    }
    return {
      projectId: parsed.project_id || projectId,
      privateKey: String(parsed.private_key || '').replace(/\\n/g, '\n'),
      clientEmail: parsed.client_email,
    }
  } catch {
    return null
  }
}

const creds = credentialsFromEnv()
if (!creds?.projectId || !creds?.privateKey || !creds?.clientEmail) {
  console.error('Missing Firebase admin credentials in .env.local')
  process.exit(1)
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: creds.projectId,
      privateKey: creds.privateKey,
      clientEmail: creds.clientEmail,
    }),
  })
}

const db = getFirestore()

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
<p>Violations may result in warnings, restricted access, or permanent removal. Serious harm may be reported to authorities where required.</p>
`.trim()

function isPlaceholderDescription(html) {
  const text = String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return /^(\d+\s*){2,}$/.test(text)
}

async function ensureCommunityGuidelines() {
  const pages = db.collection('pages')
  const bySlug = await pages.where('slug', '==', 'community-guidelines').limit(5).get()
  let docRef = bySlug.docs[0]?.ref
  let data = bySlug.docs[0]?.data() || {}

  if (!docRef) {
    const snap = await pages.limit(200).get()
    const hit = snap.docs.find((d) =>
      String(d.data().slug || '').toLowerCase().includes('community-guideline')
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
    const created = await pages.add({
      ...payload,
      createdAt: FieldValue.serverTimestamp(),
    })
    console.log('[cms] created community-guidelines', created.id)
  }
}

async function fixLadiesNightParent() {
  const communitiesSnap = await db.collection('communities').get()
  const communities = communitiesSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

  const tech = communities.find((c) =>
    /tech\s*startup|startup/i.test(String(c.name || c.title || ''))
  )
  const social =
    communities.find((c) =>
      /ladies|women|social|wellness|community\s*hub/i.test(String(c.name || c.title || ''))
    ) ||
    communities.find((c) => /passive\s*blessings|general|main/i.test(String(c.name || c.title || '')))

  let moved = 0
  for (const community of communities) {
    const groupsSnap = await db
      .collection('communities')
      .doc(community.id)
      .collection('groups')
      .get()
    for (const g of groupsSnap.docs) {
      const name = String(g.data().name || g.data().title || '')
      if (!/ladies\s*night/i.test(name)) continue

      console.log(
        `[groups] found "${name}" under "${community.name || community.title || community.id}"`
      )

      if (tech && community.id === tech.id && social && social.id !== tech.id) {
        const data = g.data()
        await db
          .collection('communities')
          .doc(social.id)
          .collection('groups')
          .doc(g.id)
          .set(
            {
              ...data,
              communityId: social.id,
              updatedAt: FieldValue.serverTimestamp(),
              _reparentedFrom: community.id,
            },
            { merge: true }
          )
        await g.ref.delete()
        moved += 1
        console.log(`[groups] moved "${name}" → "${social.name || social.id}"`)
      } else {
        console.log('[groups] leaving in place (parent looks intentional or no safer target)')
      }
    }
  }
  console.log('[groups] moved count', moved)
}

async function scrubMarketplacePlaceholders() {
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

async function verifyMapsKeys() {
  const location = await db.collection('admin').doc('locationConfig').get()
  const loc = location.data() || {}
  const hasLoc = Boolean(
    (loc.googlePlacesApiKey && String(loc.googlePlacesApiKey).startsWith('AIza')) ||
      (loc.googleMapsApiKey && String(loc.googleMapsApiKey).startsWith('AIza'))
  )

  let hasIntegration = false
  const ownerCandidates = [
    process.env.INTEGRATION_OWNER_USER_ID,
    'org',
    'system',
    'admin',
  ].filter(Boolean)

  for (const owner of ownerCandidates) {
    for (const ref of [
      db.collection('users').doc(owner).collection('integrations').doc('googleMaps'),
      db.collection('integrations').doc(`${owner}_googleMaps`),
      db.collection('integrations').doc('googleMaps'),
    ]) {
      try {
        const snap = await ref.get()
        if (!snap.exists) continue
        const blob = JSON.stringify(snap.data() || {})
        if (/AIza[0-9A-Za-z_-]{20,}/.test(blob) || /apiKey|credentials/.test(blob)) {
          hasIntegration = true
          console.log('[maps] integration doc present at', ref.path)
          break
        }
      } catch {
        /* ignore */
      }
    }
    if (hasIntegration) break
  }

  // Also scan integrations collection lightly
  if (!hasIntegration) {
    try {
      const snap = await db.collection('integrations').limit(50).get()
      for (const d of snap.docs) {
        const data = d.data() || {}
        if (
          String(data.service || data.id || d.id).toLowerCase().includes('google') ||
          String(data.serviceName || '').toLowerCase().includes('maps')
        ) {
          hasIntegration = true
          console.log('[maps] found maps-like integration', d.id)
          break
        }
      }
    } catch {
      /* ignore */
    }
  }

  console.log('[maps] locationConfig key:', hasLoc)
  console.log('[maps] integrations present:', hasIntegration)
  if (hasLoc || hasIntegration) {
    console.log('[maps] OK — Places server routes can resolve a key from Integrations/locationConfig')
  } else {
    console.warn('[maps] No key found in common paths — confirm Admin → Integrations → Google Maps is saved')
  }
}

async function main() {
  console.log('[qa-data] project', creds.projectId)
  await verifyMapsKeys()
  await ensureCommunityGuidelines()
  await fixLadiesNightParent()
  await scrubMarketplacePlaceholders()
  console.log('[qa-data] done')
}

main().catch((err) => {
  console.error('[qa-data] FAILED', err?.message || err)
  process.exit(1)
})
