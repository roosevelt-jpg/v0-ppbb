import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from './firebase'
import { HeroSliderSettings, SliderImage } from './types'

const SLIDER_COLLECTION = 'heroSlider'

export async function getHeroSliderSettings(): Promise<HeroSliderSettings | null> {
  try {
    const q = query(collection(db, SLIDER_COLLECTION), where('id', '==', 'default'))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }
    
    const data = snapshot.docs[0].data() as HeroSliderSettings
    return data
  } catch (error) {
    console.error('[v0] Error fetching hero slider settings:', error)
    return null
  }
}

export async function saveHeroSliderSettings(settings: HeroSliderSettings): Promise<boolean> {
  try {
    const docRef = doc(db, SLIDER_COLLECTION, 'default')
    await setDoc(docRef, {
      ...settings,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return true
  } catch (error) {
    console.error('[v0] Error saving hero slider settings:', error)
    return false
  }
}

export async function updateHeroSliderSettings(settings: Partial<HeroSliderSettings>): Promise<boolean> {
  try {
    const docRef = doc(db, SLIDER_COLLECTION, 'default')
    const current = await getHeroSliderSettings()
    
    if (!current) {
      // Create new settings if doesn't exist
      const newSettings: HeroSliderSettings = {
        id: 'default',
        transitionEffect: settings.transitionEffect || 'fade',
        transitionDuration: settings.transitionDuration || 500,
        autoplay: settings.autoplay !== undefined ? settings.autoplay : true,
        autoplayDuration: settings.autoplayDuration || 5,
        displayMode: settings.displayMode || 'auto',
        images: settings.images || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await setDoc(docRef, newSettings)
    } else {
      await updateDoc(docRef, {
        transitionEffect: settings.transitionEffect || current.transitionEffect,
        transitionDuration: settings.transitionDuration || current.transitionDuration,
        autoplay: settings.autoplay !== undefined ? settings.autoplay : current.autoplay,
        autoplayDuration: settings.autoplayDuration || current.autoplayDuration,
        displayMode: settings.displayMode || current.displayMode,
        updatedAt: serverTimestamp(),
      })
    }
    return true
  } catch (error) {
    console.error('[v0] Error updating hero slider settings:', error)
    return false
  }
}

export async function updateSliderImage(image: SliderImage): Promise<boolean> {
  try {
    const docRef = doc(db, SLIDER_COLLECTION, 'default')
    const current = await getHeroSliderSettings()
    
    if (!current) return false
    
    const updatedImages = current.images.map(img => 
      img.id === image.id ? image : img
    )
    
    await updateDoc(docRef, {
      images: updatedImages,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error('[v0] Error updating slider image:', error)
    return false
  }
}

export async function addSliderImage(image: SliderImage): Promise<boolean> {
  try {
    const docRef = doc(db, SLIDER_COLLECTION, 'default')
    const current = await getHeroSliderSettings()
    
    if (!current) {
      // Create new settings if doesn't exist
      const newSettings: HeroSliderSettings = {
        id: 'default',
        transitionEffect: 'fade',
        transitionDuration: 500,
        autoplay: true,
        autoplayDuration: 5,
        displayMode: 'auto',
        images: [image],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      await setDoc(docRef, newSettings)
    } else {
      const updatedImages = [...current.images, image]
      await updateDoc(docRef, {
        images: updatedImages,
        updatedAt: serverTimestamp(),
      })
    }
    return true
  } catch (error) {
    console.error('[v0] Error adding slider image:', error)
    return false
  }
}

export async function deleteSliderImage(imageId: string): Promise<boolean> {
  try {
    const docRef = doc(db, SLIDER_COLLECTION, 'default')
    const current = await getHeroSliderSettings()
    
    if (!current) return false
    
    const updatedImages = current.images.filter(img => img.id !== imageId)
    
    await updateDoc(docRef, {
      images: updatedImages,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error('[v0] Error deleting slider image:', error)
    return false
  }
}

export async function reorderSliderImages(imageIds: string[]): Promise<boolean> {
  try {
    const docRef = doc(db, SLIDER_COLLECTION, 'default')
    const current = await getHeroSliderSettings()
    
    if (!current) return false
    
    const imageMap = new Map(current.images.map(img => [img.id, img]))
    const reorderedImages = imageIds
      .map(id => imageMap.get(id))
      .filter((img): img is SliderImage => Boolean(img))
      .map((img, index) => ({ ...img, displayOrder: index }))
    
    await updateDoc(docRef, {
      images: reorderedImages,
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error('[v0] Error reordering slider images:', error)
    return false
  }
}

export async function publishHeroSlider(): Promise<boolean> {
  try {
    const docRef = doc(db, SLIDER_COLLECTION, 'default')
    await updateDoc(docRef, {
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error('[v0] Error publishing hero slider:', error)
    return false
  }
}
