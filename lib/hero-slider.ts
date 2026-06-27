import { HeroSliderSettings, SliderImage } from './types'

/**
 * Client-side hero slider data access.
 *
 * All operations go through the `/api/admin/hero-slider` route, which uses the
 * Firebase Admin SDK on the server. This is required because the admin is
 * authorized server-side (not via client Firebase Auth), so direct client-side
 * Firestore writes to the `heroSlider` collection are denied by security rules
 * and previously failed silently ("nothing happens" on add/save).
 *
 * Images are stored as individual documents in the `heroSlider/default/images`
 * subcollection so the slider can hold an unlimited number of base64-encoded
 * images without hitting Firestore's ~1 MiB per-document limit.
 */

const API_URL = '/api/admin/hero-slider'

async function postAction(action: string, payload?: unknown): Promise<boolean> {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    })
    const json = await res.json()
    if (!res.ok || !json.success) {
      console.error('[v0] Hero slider action failed:', action, json.error)
      return false
    }
    return true
  } catch (error) {
    console.error('[v0] Hero slider action error:', action, error)
    return false
  }
}

export async function getHeroSliderSettings(): Promise<HeroSliderSettings | null> {
  try {
    const res = await fetch(API_URL, { cache: 'no-store' })
    const json = await res.json()
    if (!res.ok || !json.success) {
      console.error('[v0] Error fetching hero slider settings:', json.error)
      return null
    }
    return json.data as HeroSliderSettings | null
  } catch (error) {
    console.error('[v0] Error fetching hero slider settings:', error)
    return null
  }
}

export async function updateHeroSliderSettings(
  settings: Partial<HeroSliderSettings>
): Promise<boolean> {
  // Never send the images array to the config update; images live in the
  // subcollection and are managed via the image actions.
  const { images, ...config } = settings
  return postAction('updateSettings', config)
}

export async function addSliderImage(image: SliderImage): Promise<boolean> {
  return postAction('addImage', image)
}

export async function updateSliderImage(image: SliderImage): Promise<boolean> {
  return postAction('updateImage', image)
}

export async function deleteSliderImage(imageId: string): Promise<boolean> {
  return postAction('deleteImage', { imageId })
}

export async function reorderSliderImages(imageIds: string[]): Promise<boolean> {
  return postAction('reorder', { imageIds })
}

export async function publishHeroSlider(): Promise<boolean> {
  return postAction('publish')
}
