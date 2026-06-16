import { db } from '@/lib/firebase'
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs, orderBy } from 'firebase/firestore'
import { FAQ } from '@/lib/types'

const FAQ_COLLECTION = 'faqs'

// Get all active FAQs
export const getAllFAQs = (callback: (faqs: FAQ[]) => void) => {
  const q = query(
    collection(db, FAQ_COLLECTION),
    where('isActive', '==', true),
    orderBy('order', 'asc')
  )
  return onSnapshot(q, (snapshot) => {
    const faqs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    })) as FAQ[]
    // Sort by category first, then by order
    callback(faqs.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category)
      }
      return a.order - b.order
    }))
  })
}

// Get FAQs by category
export const getFAQsByCategory = (category: string, callback: (faqs: FAQ[]) => void) => {
  const q = query(
    collection(db, FAQ_COLLECTION),
    where('isActive', '==', true),
    where('category', '==', category),
    orderBy('order', 'asc')
  )
  return onSnapshot(q, (snapshot) => {
    const faqs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    })) as FAQ[]
    callback(faqs)
  })
}

// Search FAQs by keywords or question
export const searchFAQs = (searchTerm: string, callback: (faqs: FAQ[]) => void) => {
  const q = query(
    collection(db, FAQ_COLLECTION),
    where('isActive', '==', true),
    orderBy('category', 'asc')
  )
  return onSnapshot(q, (snapshot) => {
    const allFaqs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    })) as FAQ[]
    
    const faqs = allFaqs.filter(faq => {
      const lowerSearch = searchTerm.toLowerCase()
      return (
        faq.question.toLowerCase().includes(lowerSearch) ||
        faq.answer.toLowerCase().includes(lowerSearch) ||
        faq.keywords.some(k => k.toLowerCase().includes(lowerSearch))
      )
    })
    callback(faqs)
  })
}

// Get all FAQs (admin view - including inactive)
export const getAllFAQsAdmin = (callback: (faqs: FAQ[]) => void) => {
  try {
    const q = query(collection(db, FAQ_COLLECTION), orderBy('order', 'asc'))
    return onSnapshot(q, (snapshot) => {
      const faqs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as FAQ[]
      // Sort by category first, then by order
      callback(faqs.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category)
        }
        return a.order - b.order
      }))
    }, (error) => {
      console.error('[v0] Error in getAllFAQsAdmin:', error)
      // Return empty array instead of hanging
      callback([])
    })
  } catch (error) {
    console.error('[v0] Error setting up FAQ listener:', error)
    callback([])
    return () => {} // Return noop unsubscribe
  }
}

// Add FAQ
export const addFAQ = async (faq: Omit<FAQ, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, FAQ_COLLECTION), {
      ...faq,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding FAQ:', error)
    throw error
  }
}

// Update FAQ
export const updateFAQ = async (id: string, updates: Partial<FAQ>) => {
  try {
    await updateDoc(doc(db, FAQ_COLLECTION, id), {
      ...updates,
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error('Error updating FAQ:', error)
    throw error
  }
}

// Delete FAQ
export const deleteFAQ = async (id: string) => {
  try {
    await deleteDoc(doc(db, FAQ_COLLECTION, id))
  } catch (error) {
    console.error('Error deleting FAQ:', error)
    throw error
  }
}

// Toggle FAQ active status
export const toggleFAQStatus = async (id: string) => {
  try {
    const faqRef = doc(db, FAQ_COLLECTION, id)
    const faqSnap = await getDocs(query(collection(db, FAQ_COLLECTION)))
    const faq = faqSnap.docs.find(d => d.id === id)
    
    if (faq) {
      const currentStatus = faq.data().isActive || false
      await updateDoc(faqRef, {
        isActive: !currentStatus,
        updatedAt: new Date(),
      })
    }
  } catch (error) {
    console.error('Error toggling FAQ status:', error)
    throw error
  }
}

// Increment FAQ views
export const incrementFAQViews = async (id: string) => {
  try {
    const faqRef = doc(db, FAQ_COLLECTION, id)
    const faqSnap = await getDocs(query(collection(db, FAQ_COLLECTION)))
    const faq = faqSnap.docs.find(d => d.id === id)
    if (faq) {
      const currentViews = faq.data().views || 0
      await updateDoc(faqRef, {
        views: currentViews + 1,
      })
    }
  } catch (error) {
    console.error('[v0] Error incrementing FAQ views:', error)
  }
}

// Mark FAQ as helpful
export const markFAQHelpful = async (id: string, helpful: boolean) => {
  try {
    const faqRef = doc(db, FAQ_COLLECTION, id)
    const faqSnap = await getDocs(query(collection(db, FAQ_COLLECTION)))
    const faq = faqSnap.docs.find(d => d.id === id)
    
    if (faq) {
      const faqData = faq.data()
      const updates = helpful
        ? { helpful: (faqData?.helpful || 0) + 1 }
        : { notHelpful: (faqData?.notHelpful || 0) + 1 }
      
      await updateDoc(faqRef, updates)
    }
  } catch (error) {
    console.error('[v0] Error marking FAQ:', error)
  }
}
