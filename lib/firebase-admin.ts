import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

/**
 * The GCS bucket that holds all binary files (images, PDFs, videos).
 * Firestore only ever stores the resulting public download URL — never the
 * file bytes themselves.
 */
export const STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'pasiveblessings-media'

interface AdminCredentials {
  projectId: string
  clientEmail: string
  privateKey: string
}

/**
 * Robustly parse the GCP_SERVICE_ACCOUNT env var into a service-account object.
 * Tries, in order: direct JSON (the normal case), base64-encoded JSON, and
 * finally a re-escape repair for values whose newlines were unescaped in
 * transit. Direct parse MUST come first — a value with properly escaped "\n"
 * inside private_key is valid JSON only when parsed as-is.
 */
function parseGcpServiceAccount(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw)
  } catch {
    try {
      return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'))
    } catch {
      const repaired = raw
        .replace(/\r\n/g, '\\n')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\n')
        .replace(/\t/g, '\\t')
      return JSON.parse(repaired)
    }
  }
}

/**
 * Convert literal "\\n" sequences (and strip wrapping quotes from .env values)
 * into real PEM newlines for credential.cert().
 */
function normalizePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined

  let key = raw.trim()
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1)
  }

  return key.replace(/\\n/g, '\n')
}

function credentialsFromGcpJson(): Partial<AdminCredentials> | null {
  const raw = process.env.GCP_SERVICE_ACCOUNT?.trim()
  if (!raw) return null

  try {
    const parsed = parseGcpServiceAccount(raw)
    if (!parsed || typeof parsed !== 'object') return null

    return {
      projectId: (parsed.project_id as string | undefined) || (parsed.projectId as string | undefined),
      clientEmail:
        (parsed.client_email as string | undefined) || (parsed.clientEmail as string | undefined),
      privateKey: normalizePrivateKey(
        (parsed.private_key as string | undefined) || (parsed.privateKey as string | undefined)
      ),
    }
  } catch {
    return null
  }
}

function credentialsFromEnvVars(): Partial<AdminCredentials> {
  return {
    projectId:
      process.env.FIREBASE_ADMIN_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      undefined,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
  }
}

function mergeCredentials(
  ...sources: Array<Partial<AdminCredentials> | null | undefined>
): Partial<AdminCredentials> {
  const merged: Partial<AdminCredentials> = {}

  for (const source of sources) {
    if (!source) continue
    if (!merged.projectId && source.projectId) merged.projectId = source.projectId
    if (!merged.clientEmail && source.clientEmail) merged.clientEmail = source.clientEmail
    if (!merged.privateKey && source.privateKey) merged.privateKey = source.privateKey
  }

  return merged
}

function resolveAdminCredentials(): AdminCredentials {
  const credentials = mergeCredentials(credentialsFromGcpJson(), credentialsFromEnvVars())

  const missing: string[] = []
  if (!credentials.projectId) {
    missing.push('FIREBASE_ADMIN_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID')
  }
  if (!credentials.clientEmail) {
    missing.push('FIREBASE_ADMIN_CLIENT_EMAIL')
  }
  if (!credentials.privateKey) {
    missing.push('FIREBASE_ADMIN_PRIVATE_KEY')
  }

  if (missing.length > 0) {
    throw new Error(`Firebase credentials not configured. Missing: ${missing.join(', ')}`)
  }

  return credentials as AdminCredentials
}

/**
 * Returns the shared Firebase Admin app, initializing it once. Using the Admin
 * SDK on the server bypasses Firestore security rules, which is the pattern
 * the rest of the admin API (e.g. integrations) relies on. This avoids the
 * problem of client-side writes being silently denied by deployed rules.
 */
export function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  const credentials = resolveAdminCredentials()

  return initializeApp({
    credential: cert({
      projectId: credentials.projectId,
      clientEmail: credentials.clientEmail,
      privateKey: credentials.privateKey,
    }),
    projectId: credentials.projectId,
  })
}

let adminDbSettingsApplied = false

export function getAdminDb() {
  const db = getFirestore(getAdminApp())
  if (!adminDbSettingsApplied) {
    try {
      db.settings({ ignoreUndefinedProperties: true })
      adminDbSettingsApplied = true
    } catch {
      adminDbSettingsApplied = true
    }
  }
  return db
}

/**
 * Returns the GCS bucket used for file storage. Uploads go here via the Admin
 * SDK and objects are made public, yielding a stable
 * https://storage.googleapis.com/<bucket>/<path> URL that is stored in
 * Firestore.
 */
export function getAdminBucket() {
  return getStorage(getAdminApp()).bucket(STORAGE_BUCKET)
}
