import { getFirestore, type Firestore, type QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { Integration, IntegrationHealth } from './types'
import { encryptCredentials, decryptCredentials } from './encryption'
import { initializeApp, cert, deleteApp } from 'firebase-admin/app'
import { getAdminApp, getAdminDb } from '@/lib/firebase-admin'
import {
  INTEGRATION_OWNER_USER_ID,
  integrationDocId,
} from '@/lib/integrations/constants'

const INTEGRATIONS_COLLECTION = 'integrations'
const HEALTH_COLLECTION = 'integrationHealth'

/**
 * Verify a pasted Firebase service account by spinning up a throwaway named
 * admin app with those exact credentials and performing a trivial Firestore
 * read (listCollections). If the credentials are valid and have access, this
 * resolves; otherwise it throws. The temporary app is always torn down so we
 * don't leak initialized apps. Returns true on success, false on failure.
 */
async function verifyFirebaseCredentials(sa: {
  projectId?: string
  clientEmail?: string
  privateKey?: string
}): Promise<boolean> {
  const appName = `verify-${sa.projectId || 'fb'}-${Date.now()}`
  let app
  try {
    app = initializeApp(
      {
        credential: cert({
          projectId: sa.projectId,
          clientEmail: sa.clientEmail,
          privateKey: sa.privateKey,
        } as any),
        projectId: sa.projectId,
      },
      appName
    )
    const db = getFirestore(app)
    // Lightweight, read-only check that requires valid, authorized creds.
    await db.listCollections()
    return true
  } catch (error) {
    console.error('[v0] Firebase credential verification failed:', error instanceof Error ? error.message : String(error))
    return false
  } finally {
    if (app) {
      try {
        await deleteApp(app)
      } catch {
        // ignore teardown errors
      }
    }
  }
}

/**
 * Parses a Firebase service account JSON string that may have been mangled
 * by copy/paste (e.g. a code editor or browser converting the literal "\n"
 * escape sequence inside private_key into a real newline byte). A raw,
 * unescaped newline inside a JSON string is invalid and throws
 * "Bad control character in string literal in JSON".
 *
 * Strategy: try a normal parse first (covers well-formed input). If that
 * fails, attempt a targeted repair that re-escapes raw control characters
 * (newlines, carriage returns, tabs) ONLY when they appear inside the
 * private_key value, since that's the one field that legitimately contains
 * embedded "\n" sequences and the one place copy/paste tends to corrupt.
 */
function parseServiceAccountJson(input: string): any {
  try {
    return JSON.parse(input)
  } catch (firstError) {
    // Targeted repair: find the private_key field and re-escape any raw
    // control characters within its quoted value, leaving the rest of the
    // JSON untouched.
    const repaired = input.replace(
      /("private_key"\s*:\s*")([\s\S]*?)("(?:\s*,|\s*}))/,
      (_match, prefix, keyBody, suffix) => {
        const escaped = keyBody
          .replace(/\r\n/g, '\\n')
          .replace(/\r/g, '\\n')
          .replace(/\n/g, '\\n')
          .replace(/\t/g, '\\t')
        return `${prefix}${escaped}${suffix}`
      }
    )

    try {
      return JSON.parse(repaired)
    } catch {
      // Repair didn't work either — surface the original error, it's more
      // likely to point at the real problem (e.g. truncated paste, missing
      // brace, trailing comma) than the repair attempt's error would.
      throw firstError
    }
  }
}

export async function saveIntegrationServer(
  userId: string,
  serviceId: string,
  credentials: Record<string, string>
): Promise<Integration> {
  try {
    console.log('[v0] Saving integration (server):', serviceId, 'for', userId)

    // A successful save (credentials provided + required fields validated by
    // the modal/provider config) marks the integration 'active'. Firebase is
    // the one provider we can verify live from the server, so it may override
    // this to 'error' below if the pasted key doesn't actually connect.
    let status: Integration['status'] = 'active'

    // If Firebase integration, parse the serviceAccountJson blob into individual fields
    if (serviceId === 'firebase' && credentials.serviceAccountJson) {
      let sa: any
      try {
        sa = parseServiceAccountJson(credentials.serviceAccountJson)
      } catch (parseErr) {
        throw new Error('Invalid service account JSON. Please paste the complete JSON file.')
      }

      const requiredFields = ['project_id', 'private_key', 'client_email']
      const missing = requiredFields.filter((field) => !sa?.[field] && !sa?.[toCamelCase(field)])
      if (missing.length > 0) {
        throw new Error(
          `Service account JSON is missing required field(s): ${missing.join(', ')}`
        )
      }

      // Drop the raw blob so the private key isn't stored twice (once in
      // the blob, once in the extracted field) once we have the parsed
      // fields we actually need.
      const { serviceAccountJson, ...rest } = credentials
      credentials = {
        ...rest,
        projectId: sa.project_id || sa.projectId,
        privateKeyId: sa.private_key_id || sa.privateKeyId,
        privateKey: sa.private_key || sa.privateKey,
        clientEmail: sa.client_email || sa.clientEmail,
      }

      // Verify the pasted credentials actually connect to Firestore. If they
      // do, mark the integration active; otherwise leave it as 'error' so the
      // admin knows the key was saved but isn't working.
      const verified = await verifyFirebaseCredentials({
        projectId: credentials.projectId,
        clientEmail: credentials.clientEmail,
        privateKey: credentials.privateKey,
      })
      status = verified ? 'active' : 'error'
    }

    const encrypted = encryptCredentials(credentials, serviceId)
    const integrationId = integrationDocId(serviceId, userId)
    const db = getAdminDb()

    const integration: Integration = {
      id: integrationId,
      userId,
      serviceId,
      serviceName: credentials.serviceName || serviceId,
      credentials: encrypted,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection(INTEGRATIONS_COLLECTION).doc(integrationId).set({
      ...integration,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true })

    console.log('[v0] Integration saved (server):', integrationId)
    return integration
  } catch (error) {
    console.error('[v0] Error saving integration (server):', error)
    throw error
  }
}

function toCamelCase(snake: string): string {
  return snake.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

export async function getIntegrationServer(userId: string, serviceId: string): Promise<Integration | null> {
  try {
    const integrationId = integrationDocId(serviceId, userId)
    const db = getAdminDb()
    const snap = await db.collection(INTEGRATIONS_COLLECTION).doc(integrationId).get()

    if (!snap.exists) return null

    const data = snap.data() as Integration
    return {
      ...data,
      credentials: decryptCredentials(data.credentials, serviceId),
    }
  } catch (error) {
    console.error('[v0] Error getting integration (server):', error)
    throw error
  }
}

function integrationStatusRank(status: Integration['status']): number {
  switch (status) {
    case 'active':
      return 4
    case 'error':
      return 3
    case 'inactive':
      return 2
    case 'pending':
      return 1
    default:
      return 0
  }
}

function toMillis(value: unknown): number {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string' || typeof value === 'number') {
    const ms = new Date(value).getTime()
    return Number.isNaN(ms) ? 0 : ms
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate().getTime()
    } catch {
      return 0
    }
  }
  return 0
}

/** Merge duplicate service rows (legacy per-admin saves) — prefer active, then newest. */
function mergeIntegrationsByService(integrations: Integration[]): Integration[] {
  const byService = new Map<string, Integration>()
  for (const integration of integrations) {
    const existing = byService.get(integration.serviceId)
    if (!existing) {
      byService.set(integration.serviceId, integration)
      continue
    }
    const rankNew = integrationStatusRank(integration.status)
    const rankOld = integrationStatusRank(existing.status)
    const updatedNew = toMillis(integration.updatedAt)
    const updatedOld = toMillis(existing.updatedAt)
    if (rankNew > rankOld || (rankNew === rankOld && updatedNew > updatedOld)) {
      byService.set(integration.serviceId, integration)
    }
  }
  return Array.from(byService.values())
}

async function migrateToCanonicalOwner(
  db: Firestore,
  integration: Integration,
  ownerUserId: string
): Promise<void> {
  const canonicalId = integrationDocId(integration.serviceId, ownerUserId)
  if (integration.id === canonicalId && integration.userId === ownerUserId) return

  const encrypted = encryptCredentials(integration.credentials || {}, integration.serviceId)
  await db.collection(INTEGRATIONS_COLLECTION).doc(canonicalId).set(
    {
      ...integration,
      id: canonicalId,
      userId: ownerUserId,
      credentials: encrypted,
      updatedAt: new Date(),
    },
    { merge: true }
  )
}

function normalizeCredentialRecord(
  credentials: Record<string, string> | null | undefined
): Record<string, string> {
  if (!credentials || typeof credentials !== 'object' || Array.isArray(credentials)) {
    return {}
  }
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(credentials)) {
    if (value == null) continue
    out[key] = typeof value === 'string' ? value : String(value)
  }
  return out
}

function toClientIntegration(input: {
  id: string
  serviceId: string
  userId?: string
  serviceName?: string
  status?: string
  credentials?: Record<string, string>
  createdAt?: unknown
  updatedAt?: unknown
}): Record<string, unknown> {
  const creds = normalizeCredentialRecord(input.credentials)
  const hasCredentials = Object.keys(creds).length > 0
  let status = input.status || 'inactive'
  // Treat configured rows as active in the UI even if status was never set / left inactive.
  if (hasCredentials && (status === 'inactive' || status === 'pending' || !status || status === 'undefined')) {
    status = 'active'
  }
  // Also treat any non-error configured row as active (matches IntegrationCard).
  if (hasCredentials && status !== 'error' && status !== 'active') {
    status = 'active'
  }
  const createdMs = toMillis(input.createdAt)
  const updatedMs = toMillis(input.updatedAt)
  return {
    id: input.id,
    userId: input.userId || INTEGRATION_OWNER_USER_ID,
    serviceId: input.serviceId,
    serviceName: input.serviceName || input.serviceId,
    status,
    credentials: creds,
    createdAt: createdMs ? new Date(createdMs).toISOString() : null,
    updatedAt: updatedMs ? new Date(updatedMs).toISOString() : null,
  }
}

function mapIntegrationDoc(docSnap: QueryDocumentSnapshot): Record<string, unknown> | null {
  try {
    const data = docSnap.data() || {}
    const serviceId = typeof data.serviceId === 'string' ? data.serviceId : ''
    if (!serviceId) {
      // Recover serviceId from canonical doc id: `{owner}_{serviceId}`
      const id = docSnap.id
      const prefix = `${INTEGRATION_OWNER_USER_ID}_`
      if (id.startsWith(prefix)) {
        const recovered = id.slice(prefix.length)
        if (!recovered) return null
        let credentials: Record<string, string> = {}
        try {
          credentials = decryptCredentials(
            normalizeCredentialRecord(data.credentials as Record<string, string>),
            recovered
          )
        } catch {
          credentials = normalizeCredentialRecord(data.credentials as Record<string, string>)
        }
        return toClientIntegration({
          id: docSnap.id,
          serviceId: recovered,
          userId: typeof data.userId === 'string' ? data.userId : INTEGRATION_OWNER_USER_ID,
          serviceName: typeof data.serviceName === 'string' ? data.serviceName : recovered,
          status: typeof data.status === 'string' ? data.status : 'active',
          credentials,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        })
      }
      return null
    }

    let credentials: Record<string, string> = {}
    try {
      credentials = decryptCredentials(
        normalizeCredentialRecord(data.credentials as Record<string, string>),
        serviceId
      )
    } catch {
      credentials = normalizeCredentialRecord(data.credentials as Record<string, string>)
    }

    return toClientIntegration({
      id: docSnap.id,
      serviceId,
      userId: typeof data.userId === 'string' ? data.userId : INTEGRATION_OWNER_USER_ID,
      serviceName: typeof data.serviceName === 'string' ? data.serviceName : serviceId,
      status: typeof data.status === 'string' ? data.status : 'inactive',
      credentials,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  } catch (error) {
    console.error('[v0] Failed to map integration doc', docSnap.id, error)
    return null
  }
}

export async function getAllIntegrationsServer(
  userId: string = INTEGRATION_OWNER_USER_ID
): Promise<Integration[]> {
  const db = getAdminDb()
  let docs: QueryDocumentSnapshot[] = []

  try {
    const ownerSnap = await db
      .collection(INTEGRATIONS_COLLECTION)
      .where('userId', '==', userId)
      .get()
    docs = ownerSnap.docs
  } catch (error) {
    console.warn('[v0] Owner integrations query failed, falling back to full scan:', error)
  }

  if (docs.length === 0) {
    const snap = await db.collection(INTEGRATIONS_COLLECTION).get()
    docs = snap.docs
  }

  const mapped = docs
    .map((docSnap) => mapIntegrationDoc(docSnap))
    .filter((row): row is Record<string, unknown> => Boolean(row))

  // Prefer canonical owner rows when duplicates exist.
  const byService = new Map<string, Record<string, unknown>>()
  for (const row of mapped) {
    const serviceId = String(row.serviceId || '')
    if (!serviceId) continue
    const existing = byService.get(serviceId)
    if (!existing) {
      byService.set(serviceId, row)
      continue
    }
    const rankNew = integrationStatusRank(row.status as Integration['status'])
    const rankOld = integrationStatusRank(existing.status as Integration['status'])
    const updatedNew = toMillis(row.updatedAt)
    const updatedOld = toMillis(existing.updatedAt)
    if (rankNew > rankOld || (rankNew === rankOld && updatedNew > updatedOld)) {
      byService.set(serviceId, row)
    }
  }

  return Array.from(byService.values()) as unknown as Integration[]
}

export async function deleteIntegrationServer(userId: string, serviceId: string): Promise<void> {
  try {
    const integrationId = integrationDocId(serviceId, userId)
    const db = getAdminDb()
    await db.collection(INTEGRATIONS_COLLECTION).doc(integrationId).delete()
    console.log('[v0] Integration deleted (server):', integrationId)
  } catch (error) {
    console.error('[v0] Error deleting integration (server):', error)
    throw error
  }
}

export async function updateIntegrationStatusServer(
  userId: string,
  serviceId: string,
  status: 'active' | 'inactive' | 'error' | 'pending'
): Promise<void> {
  try {
    const integrationId = integrationDocId(serviceId, userId)
    const db = getAdminDb()
    await db.collection(INTEGRATIONS_COLLECTION).doc(integrationId).update({
      status,
      updatedAt: new Date(),
    })
    console.log('[v0] Integration status updated (server):', integrationId, status)
  } catch (error) {
    console.error('[v0] Error updating integration status (server):', error)
    throw error
  }
}

export async function getIntegrationHealthServer(serviceId: string): Promise<IntegrationHealth | null> {
  try {
    const db = getAdminDb()
    const snap = await db.collection(HEALTH_COLLECTION).doc(serviceId).get()
    return snap.exists ? (snap.data() as IntegrationHealth) : null
  } catch (error) {
    console.error('[v0] Error getting health (server):', error)
    throw error
  }
}

export async function getAllIntegrationHealthServer(): Promise<IntegrationHealth[]> {
  try {
    const db = getAdminDb()
    const snap = await db.collection(HEALTH_COLLECTION).get()
    return snap.docs.map((doc) => doc.data() as IntegrationHealth)
  } catch (error) {
    console.error('[v0] Error getting all health (server):', error)
    throw error
  }
}

export async function saveIntegrationHealthServer(health: IntegrationHealth): Promise<void> {
  try {
    const db = getAdminDb()
    await db.collection(HEALTH_COLLECTION).doc(health.serviceId).set(
      { ...health, updatedAt: new Date() },
      { merge: true }
    )
  } catch (error) {
    console.error('[v0] Error saving health (server):', error)
    throw error
  }
}
