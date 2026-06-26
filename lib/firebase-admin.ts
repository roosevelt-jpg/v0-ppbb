import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

/**
 * Robustly parse the GCP_SERVICE_ACCOUNT env var into a service-account object.
 * Tries, in order: direct JSON (the normal case), base64-encoded JSON, and
 * finally a re-escape repair for values whose newlines were unescaped in
 * transit. Direct parse MUST come first — a value with properly escaped "\n"
 * inside private_key is valid JSON only when parsed as-is.
 */
function parseGcpServiceAccount(raw: string): any {
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
 * Returns the shared Firebase Admin app, initializing it once. Using the Admin
 * SDK on the server bypasses Firestore security rules, which is the pattern
 * the rest of the admin API (e.g. integrations) relies on. This avoids the
 * problem of client-side writes being silently denied by deployed rules.
 */
export function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  let serviceAccount: any = null

  if (process.env.GCP_SERVICE_ACCOUNT) {
    serviceAccount = parseGcpServiceAccount(process.env.GCP_SERVICE_ACCOUNT)
  } else {
    serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }
  }

  if (!serviceAccount?.project_id && !serviceAccount?.projectId) {
    throw new Error('Firebase credentials not configured')
  }

  return initializeApp({
    credential: cert(serviceAccount as any),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

export function getAdminDb() {
  return getFirestore(getAdminApp())
}
