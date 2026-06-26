import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { HeroSliderSettings, SliderImage } from './types'

const SLIDER_COLLECTION = 'heroSlider'
const SLIDER_DOC = 'default'
const IMAGES_SUBCOLLECTION = 'images'

function configDocRef() {
  return doc(db, SLIDER_COLLECTION, SLIDER_DOC)
}

function imagesColRef() {
  return collection(db, SLIDER_COLLECTION, SLIDER_DOC, IMAGES_SUBCOLLECTION)
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

/**
 * Read the slider config doc plus all images from the images subcollection.
 * Images are stored as individual documents (not a single array) so the
 * slider can hold an unlimited number of base64-encoded images without
 * hitting Firestore's ~1 MiB per-document limit.
 */
export async function getHeroSliderSettings(): Promise<HeroSliderSettings | null> {
  try {
    const [configSnap, imagesSnap] = await Promise.all([
      getDoc(configDocRef()),
      getDocs(imagesColRef()),
    ])

    const config = configSnap.exists()
      ? (configSnap.data() as Partial<HeroSliderSettings>)
      : {}

    const images: SliderImage[] = imagesSnap.docs
      .map((d) => d.data() as SliderImage)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))

    // Return null only if nothing has ever been configured.
    if (!configSnap.exists() && images.length === 0) {
      return null
    }

    return {
      ...DEFAULT_CONFIG,
      ...config,
      id: 'default',
      images,
    } as HeroSliderSettings
  } catch (error) {
    console.error('[v0] Error fetching hero slider settings:', error)
    return null
  }
}

/** Ensure the config document exists before writing related data. */
async function ensureConfigDoc(): Promise<void> {
  const snap = await getDoc(configDocRef())
  if (!snap.exists()) {
    await setDoc(configDocRef(), {
      ...DEFAULT_CONFIG,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
}

export async function updateHeroSliderSettings(
  settings: Partial<HeroSliderSettings>
): Promise<boolean> {
  try {
    await ensureConfigDoc()
    // Never write the images array into the config doc; images live in the
    // subcollection.
    const { images, ...config } = settings
    await updateDoc(configDocRef(), {
      ...config,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error('[v0] Error updating hero slider settings:', error)
    return false
  }
}

export async function addSliderImage(image: SliderImage): Promise<boolean> {
  try {
    await ensureConfigDoc()
    await setDoc(doc(imagesColRef(), image.id), {
      ...image,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error('[v0] Error adding slider image:', error)
    return false
  }
}

export async function updateSliderImage(image: SliderImage): Promise<boolean> {
  try {
    await setDoc(
      doc(imagesColRef(), image.id),
      { ...image, updatedAt: serverTimestamp() },
      { merge: true }
    )
    return true
  } catch (error) {
    console.error('[v0] Error updating slider image:', error)
    return false
  }
}

export async function deleteSliderImage(imageId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(imagesColRef(), imageId))
    return true
  } catch (error) {
    console.error('[v0] Error deleting slider image:', error)
    return false
  }
}

export async function reorderSliderImages(imageIds: string[]): Promise<boolean> {
  try {
    const batch = writeBatch(db)
    imageIds.forEach((id, index) => {
      batch.update(doc(imagesColRef(), id), {
        displayOrder: index,
        updatedAt: serverTimestamp(),
      })
    })
    await batch.commit()
    return true
  } catch (error) {
    console.error('[v0] Error reordering slider images:', error)
    return false
  }
}

export async function publishHeroSlider(): Promise<boolean> {
  try {
    await ensureConfigDoc()
    await updateDoc(configDocRef(), {
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error('[v0] Error publishing hero slider:', error)
    return false
  }
}
