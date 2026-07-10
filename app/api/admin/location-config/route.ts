import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { auditAdminApiAction, tryResolveAdminUid } from '@/lib/audit-api-helper'
import { getIntegrationServer, saveIntegrationServer } from '@/lib/integrations/handlers-server'
import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'
import { serializeFirestoreValue } from '@/lib/serialize-firestore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COLLECTION = 'admin'
const DOC_ID = 'locationConfig'

const DEFAULT_CONFIG = {
  googleMapsApiKey: '',
  googlePlacesApiKey: '',
  enableAutoDetect: true,
  autoDetectRadius: 50,
  defaultCountry: 'AE',
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

async function resolveKeysFromIntegrations(): Promise<{
  googleMapsApiKey: string
  googlePlacesApiKey: string
}> {
  try {
    const integration = await getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'googleMaps')
    const apiKey = asString(integration?.credentials?.apiKey)
    return { googleMapsApiKey: apiKey, googlePlacesApiKey: apiKey }
  } catch {
    return { googleMapsApiKey: '', googlePlacesApiKey: '' }
  }
}

/**
 * GET /api/admin/location-config
 * Reads location configuration via Admin SDK. Falls back to Integrations
 * googleMaps credentials and env vars so the admin page stays usable.
 */
export async function GET() {
  try {
    const db = getAdminDb()
    const snap = await db.collection(COLLECTION).doc(DOC_ID).get()
    const raw = snap.exists
      ? (serializeFirestoreValue(snap.data() as Record<string, unknown>) as Record<string, unknown>)
      : null

    const fromIntegrations = await resolveKeysFromIntegrations()
    const envMaps =
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      ''
    const envPlaces =
      process.env.GOOGLE_PLACES_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
      envMaps

    const data = {
      ...DEFAULT_CONFIG,
      ...(raw || {}),
      googleMapsApiKey:
        asString(raw?.googleMapsApiKey) ||
        fromIntegrations.googleMapsApiKey ||
        envMaps ||
        '',
      googlePlacesApiKey:
        asString(raw?.googlePlacesApiKey) ||
        fromIntegrations.googlePlacesApiKey ||
        envPlaces ||
        '',
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[v0] Error loading location config (server):', error)
    // Last-resort fallback so the page is not blank when Firestore is flaky.
    try {
      const fromIntegrations = await resolveKeysFromIntegrations()
      const envMaps =
        process.env.GOOGLE_MAPS_API_KEY ||
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
        ''
      const envPlaces =
        process.env.GOOGLE_PLACES_API_KEY ||
        process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
        envMaps
      return NextResponse.json({
        success: true,
        data: {
          ...DEFAULT_CONFIG,
          googleMapsApiKey: fromIntegrations.googleMapsApiKey || envMaps,
          googlePlacesApiKey: fromIntegrations.googlePlacesApiKey || envPlaces,
        },
        warning: 'Loaded from fallback sources (Integrations / env)',
      })
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to load configuration',
        },
        { status: 500 }
      )
    }
  }
}

/**
 * POST /api/admin/location-config
 * Saves location configuration and mirrors the Maps key into Integrations.
 */
export async function POST(request: Request) {
  try {
    const adminUid = await tryResolveAdminUid(request)
    const body = await request.json()

    if (!body.googleMapsApiKey || !body.googlePlacesApiKey) {
      return NextResponse.json(
        { success: false, error: 'Both Google Maps and Google Places API keys are required.' },
        { status: 400 }
      )
    }

    const radius = Number(body.autoDetectRadius)
    if (Number.isNaN(radius) || radius < 1 || radius > 500) {
      return NextResponse.json(
        { success: false, error: 'Auto-detect radius must be between 1 and 500 km.' },
        { status: 400 }
      )
    }

    const payload = {
      googleMapsApiKey: String(body.googleMapsApiKey),
      googlePlacesApiKey: String(body.googlePlacesApiKey),
      enableAutoDetect: Boolean(body.enableAutoDetect),
      autoDetectRadius: radius,
      defaultCountry: String(body.defaultCountry || 'AE'),
      updatedAt: new Date().toISOString(),
      updatedBy: adminUid || 'admin',
    }

    const db = getAdminDb()
    await db.collection(COLLECTION).doc(DOC_ID).set(payload, { merge: true })

    // Keep Integrations > Google Maps in sync so other consumers stay Active.
    try {
      await saveIntegrationServer(INTEGRATION_OWNER_USER_ID, 'googleMaps', {
        apiKey: payload.googleMapsApiKey || payload.googlePlacesApiKey,
        serviceName: 'Google Maps API',
      })
    } catch (syncError) {
      console.warn('[v0] Could not sync location keys to integrations:', syncError)
    }

    if (adminUid) {
      await auditAdminApiAction(request, adminUid, {
        actionType: 'update',
        action: 'Updated location configuration',
        entityType: 'settings',
        entityId: DOC_ID,
        entityName: 'Location Config',
        status: 'success',
        details: `Country: ${payload.defaultCountry}; Auto-detect: ${payload.enableAutoDetect}`,
      })
    }

    return NextResponse.json({ success: true, data: payload })
  } catch (error) {
    console.error('[v0] Error saving location config (server):', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save configuration',
      },
      { status: 500 }
    )
  }
}
