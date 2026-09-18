/**
 * Ensure Firestore collectionGroup index on members.userId.
 * Uses the same Admin credentials as other scripts (.env.local).
 *
 * Usage: node --env-file=.env.local scripts/deploy-members-index.mjs
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

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
  console.error(
    'Missing Firebase admin credentials. Set FIREBASE_ADMIN_* or GCP_SERVICE_ACCOUNT in .env.local'
  )
  process.exit(1)
}

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: creds.projectId,
          privateKey: creds.privateKey,
          clientEmail: creds.clientEmail,
        }),
      })

async function getAccessToken() {
  const token = await app.options.credential.getAccessToken()
  return token.access_token
}

async function main() {
  // Smoke-test Admin SDK connectivity
  const db = getFirestore()
  await db.collection('_pb_health').doc('index-deploy').set(
    { checkedAt: new Date().toISOString(), ok: true },
    { merge: true }
  )
  console.log('[indexes] Admin SDK connected to', creds.projectId)

  const token = await getAccessToken()
  const base = `https://firestore.googleapis.com/v1/projects/${creds.projectId}/databases/(default)`

  // Prefer field override (matches firestore.indexes.json fieldOverrides for members.userId)
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
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(fieldBody),
  })
  const patchJson = await patchRes.json().catch(() => ({}))
  console.log('[indexes] field patch', patchRes.status, JSON.stringify(patchJson).slice(0, 1200))

  if (patchRes.ok) {
    console.log('[indexes] members.userId COLLECTION_GROUP indexes requested successfully')
    return
  }

  // Fallback: create as a collection group index document
  const createRes = await fetch(`${base}/collectionGroups/members/indexes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      queryScope: 'COLLECTION_GROUP',
      fields: [{ fieldPath: 'userId', order: 'ASCENDING' }],
    }),
  })
  const createJson = await createRes.json().catch(() => ({}))
  console.log('[indexes] create', createRes.status, JSON.stringify(createJson).slice(0, 1200))

  if (
    createRes.ok ||
    createRes.status === 409 ||
    /ALREADY_EXISTS|already exists/i.test(JSON.stringify(createJson))
  ) {
    console.log('[indexes] members.userId index OK')
    return
  }

  console.error('[indexes] FAILED to create index — open Firebase Console → Firestore → Indexes and add collection group members.userId ASC')
  process.exitCode = 1
}

main().catch((err) => {
  console.error('[indexes] FAILED', err?.message || err)
  process.exit(1)
})
