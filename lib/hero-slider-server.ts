import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from './firebase-admin'
import type { HeroSliderSettings, SliderImage } from './types'

const SLIDER_COLLECTION = 'heroSlider'
const SLIDER_DOC = 'default'
const IMAGES_SUBCOLLECTION = 'images'

function configDocRef() {
  return getAdminDb().collection(SLIDER_COLLECTION).doc(SLIDER_DOC)
}

function imagesColRef() {
  return configDocRef().collection(IMAGES_SUBCOLLECTION)
}

const DEFAULT_CONFIG: Omit<HeroSliderSettings, 'images'> = {
  id: 'default',
  transitionEffect: 'fade',
  transitionDuration: 500,
  autoplay: true,
  autoplayDuration: 5,
  displayMode: 'auto',
  createdAt: new Date(),
  updatedAt: new Date(),
}

/** Strip Firestore Timestamps so the result is JSON-serializable. */
function serialize<T>(data: any): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      if (value && typeof value.toDate === 'function') {
        return value.toDate().toISOString()
      }
      return value
    })
  )
}

export async function getHeroSliderSettingsServer(): Promise<HeroSliderSettings | null> {
  const [configSnap, imagesSnap] = await Promise.all([
    configDocRef().get(),
    imagesColRef().get(),
  ])

  const config = configSnap.exists ? (configSnap.data() as Partial<HeroSliderSettings>) : {}
  const images: SliderImage[] = imagesSnap.docs
    .map((d) => d.data() as SliderImage)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))

  if (!configSnap.exists && images.length === 0) {
    return null
  }

  return serialize<HeroSliderSettings>({
    ...DEFAULT_CONFIG,
    ...config,
    id: 'default',
    images,
  })
}

async function ensureConfigDoc(): Promise<void> {
  const snap = await configDocRef().get()
  if (!snap.exists) {
    await configDocRef().set({
      ...DEFAULT_CONFIG,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }
}

export async function updateHeroSliderSettingsServer(
  settings: Partial<HeroSliderSettings>
): Promise<void> {
  await ensureConfigDoc()
  // Images live in the subcollection; never write them into the config doc.
  const { images, ...config } = settings
  await configDocRef().set(
    { ...config, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  )
}

export async function addSliderImageServer(image: SliderImage): Promise<void> {
  await ensureConfigDoc()
  await imagesColRef().doc(image.id).set({
    ...image,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
}

export async function updateSliderImageServer(image: SliderImage): Promise<void> {
  await imagesColRef().doc(image.id).set(
    { ...image, updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  )
}

export async function deleteSliderImageServer(imageId: string): Promise<void> {
  await imagesColRef().doc(imageId).delete()
}

export async function reorderSliderImagesServer(imageIds: string[]): Promise<void> {
  const db = getAdminDb()
  const batch = db.batch()
  imageIds.forEach((id, index) => {
    batch.update(imagesColRef().doc(id), {
      displayOrder: index,
      updatedAt: FieldValue.serverTimestamp(),
    })
  })
  await batch.commit()
}

export async function publishHeroSliderServer(): Promise<void> {
  await ensureConfigDoc()
  await configDocRef().set(
    {
      publishedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
}
