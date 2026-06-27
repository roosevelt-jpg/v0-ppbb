import { NextResponse } from 'next/server'
import { getHeroSliderSettingsServer } from '@/lib/hero-slider-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/hero-slider  (PUBLIC)
 *
 * Returns the hero slider config + all images for the public homepage.
 * Reads via the Admin SDK so it works regardless of Firestore client security
 * rules (the homepage's client-side read of the `heroSlider/default/images`
 * subcollection is denied by the deployed rules). Slider content is public, so
 * no auth is required here.
 */
export async function GET() {
  try {
    const data = await getHeroSliderSettingsServer()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[v0] Error loading public hero slider:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load hero slider' },
      { status: 500 }
    )
  }
}
