import { getFirestore } from 'firebase-admin/firestore'
import { Integration, IntegrationHealth } from './types'
import { encryptCredentials, decryptCredentials } from './encryption'
import { initializeApp, cert, deleteApp } from 'firebase-admin/app'
import { getAdminApp, getAdminDb } from '@/lib/firebase-admin'

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
    const integrationId = `${userId}_${serviceId}`
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
    const integrationId = `${userId}_${serviceId}`
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

export async function getAllIntegrationsServer(userId: string): Promise<Integration[]> {
  try {
    const db = getAdminDb()
    const snap = await db.collection(INTEGRATIONS_COLLECTION).where('userId', '==', userId).get()

    const integrations = snap.docs.map((doc) => {
      const data = doc.data() as Integration
      return {
        ...data,
        credentials: decryptCredentials(data.credentials, data.serviceId),
      }
    })

    // Self-heal: integrations saved before this status logic existed are stuck
    // as 'pending' even though they have stored credentials. Promote them so
    // the badge reflects that they're configured. Firebase is verified live
    // (active/error); every other provider with stored credentials becomes
    // 'active'. Persist the change so future loads are fast.
    await Promise.all(
      integrations.map(async (integration) => {
        const hasCredentials =
          !!integration.credentials && Object.keys(integration.credentials).length > 0
        if (integration.status === 'active' || !hasCredentials) return

        let newStatus: Integration['status']
        if (
          integration.serviceId === 'firebase' &&
          integration.credentials?.privateKey &&
          integration.credentials?.clientEmail &&
          integration.credentials?.projectId
        ) {
          const verified = await verifyFirebaseCredentials({
            projectId: integration.credentials.projectId,
            clientEmail: integration.credentials.clientEmail,
            privateKey: integration.credentials.privateKey,
          })
          newStatus = verified ? 'active' : 'error'
        } else if (integration.status === 'pending') {
          // Configured non-Firebase integration that was never marked active.
          newStatus = 'active'
        } else {
          return
        }

        if (newStatus !== integration.status) {
          integration.status = newStatus
          await db
            .collection(INTEGRATIONS_COLLECTION)
            .doc(integration.id)
            .set({ status: newStatus, updatedAt: new Date() }, { merge: true })
        }
      })
    )

    return integrations
  } catch (error) {
    console.error('[v0] Error getting all integrations (server):', error)
    throw error
  }
}

export async function deleteIntegrationServer(userId: string, serviceId: string): Promise<void> {
  try {
    const integrationId = `${userId}_${serviceId}`
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
    const integrationId = `${userId}_${serviceId}`
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
