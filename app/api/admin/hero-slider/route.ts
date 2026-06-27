import { NextResponse } from 'next/server'
import {
  getHeroSliderSettingsServer,
  updateHeroSliderSettingsServer,
  addSliderImageServer,
  updateSliderImageServer,
  deleteSliderImageServer,
  reorderSliderImagesServer,
  publishHeroSliderServer,
} from '@/lib/hero-slider-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/hero-slider
 * Returns the slider config + all images (read via the Admin SDK so it works
 * regardless of client auth state).
 */
export async function GET() {
  try {
    const data = await getHeroSliderSettingsServer()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[v0] Error loading hero slider (server):', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load hero slider' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/hero-slider
 * Action-dispatched writes via the Admin SDK (client writes are denied by
 * Firestore security rules since the admin is authorized server-side).
 * Body: { action, payload }
 */
export async function POST(request: Request) {
  try {
    const { action, payload } = await request.json()

    switch (action) {
      case 'updateSettings':
        await updateHeroSliderSettingsServer(payload)
        break
      case 'addImage':
        await addSliderImageServer(payload)
        break
      case 'updateImage':
        await updateSliderImageServer(payload)
        break
      case 'deleteImage':
        await deleteSliderImageServer(payload.imageId)
        break
      case 'reorder':
        await reorderSliderImagesServer(payload.imageIds)
        break
      case 'publish':
        await publishHeroSliderServer()
        break
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error writing hero slider (server):', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save hero slider changes' },
      { status: 500 }
    )
  }
}
