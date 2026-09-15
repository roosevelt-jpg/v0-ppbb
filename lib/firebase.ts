import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import {
  DEFAULT_FIREBASE_PROJECT_ID,
  DEFAULT_STORAGE_BUCKET,
} from '@/lib/storage-bucket'

if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  console.error(
    '[v0] Missing Firebase client config. Ensure all NEXT_PUBLIC_FIREBASE_* variables are set in .env.local'
  )
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDummyKeyForBuild',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    `${DEFAULT_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || DEFAULT_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef123456',
}

// Initialize Firebase only once
let app
let authInstance
let dbInstance
let storageInstance

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  authInstance = getAuth(app)
  dbInstance = getFirestore(app)
  storageInstance = getStorage(app)
} catch (error) {
  console.warn('[v0] Firebase initialization warning:', error)
  // Return null proxies for build-time execution
}

// Get Firebase services
export const auth = authInstance || ({} as any)
export const db = dbInstance || ({} as any)
export const storage = storageInstance || ({} as any)

export default app
