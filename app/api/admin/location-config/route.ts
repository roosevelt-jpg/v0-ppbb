import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'

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

/**
 * GET /api/admin/location-config
 * Reads the location configuration using the Admin SDK (bypasses Firestore
 * security rules, which deny client-side reads of the protected `admin`
 * collection). Returns defaults when nothing is stored yet.
 */
export async function GET() {
  try {
    const db = getAdminDb()
    const snap = await db.collection(COLLECTION).doc(DOC_ID).get()
    const data = snap.exists ? snap.data() : null
    return NextResponse.json({
      success: true,
      data: { ...DEFAULT_CONFIG, ...(data || {}) },
    })
  } catch (error) {
    console.error('[v0] Error loading location config (server):', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load configuration' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/location-config
 * Saves the location configuration using the Admin SDK.
 */
export async function POST(request: Request) {
  try {
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
      updatedAt: new Date(),
      updatedBy: 'admin',
    }

    const db = getAdminDb()
    await db.collection(COLLECTION).doc(DOC_ID).set(payload, { merge: true })

    return NextResponse.json({ success: true, data: payload })
  } catch (error) {
    console.error('[v0] Error saving location config (server):', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}
