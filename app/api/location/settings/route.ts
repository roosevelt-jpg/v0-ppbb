import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { serializeFirestoreValue } from '@/lib/serialize-firestore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULTS = {
  enableAutoDetect: true,
  autoDetectRadius: 50,
  defaultCountry: 'AE',
}

/**
 * Public location settings (no API keys).
 * Used by signup + event address pickers.
 */
export async function GET() {
  try {
    const snap = await getAdminDb().collection('admin').doc('locationConfig').get()
    const raw = snap.exists
      ? (serializeFirestoreValue(snap.data() as Record<string, unknown>) as Record<string, unknown>)
      : {}

    return NextResponse.json({
      success: true,
      data: {
        enableAutoDetect:
          typeof raw.enableAutoDetect === 'boolean'
            ? raw.enableAutoDetect
            : DEFAULTS.enableAutoDetect,
        autoDetectRadius:
          typeof raw.autoDetectRadius === 'number'
            ? raw.autoDetectRadius
            : DEFAULTS.autoDetectRadius,
        defaultCountry:
          typeof raw.defaultCountry === 'string' && raw.defaultCountry.trim()
            ? raw.defaultCountry.trim().toUpperCase()
            : DEFAULTS.defaultCountry,
      },
    })
  } catch (error) {
    console.error('[location/settings]', error)
    return NextResponse.json({ success: true, data: DEFAULTS })
  }
}
