'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth'
import { User, BusinessProfile } from '@/lib/types'

interface AuthContextType {
  user: User | BusinessProfile | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | BusinessProfile | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined
    let cancelled = false

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile()
        unsubscribeProfile = undefined
      }

      setFirebaseUser(currentUser)

      if (currentUser) {
        setLoading(true)
        const uid = currentUser.uid

        const subscribeProfile = async () => {
          try {
            // Wait for the auth token before Firestore reads (avoids permission-denied races)
            await currentUser.getIdToken(true)
            if (cancelled) return

            unsubscribeProfile = onSnapshot(
              doc(db, 'users', uid),
              (snap) => {
                if (snap.exists()) {
                  setUser({ id: snap.id, ...snap.data() } as User | BusinessProfile)
                } else {
                  setUser(null)
                }
                setLoading(false)
              },
              (error) => {
                console.error('[v0] Error subscribing to user profile:', error)
                setUser(null)
                setLoading(false)
              }
            )
          } catch (error) {
            console.error('[v0] Error preparing user profile subscription:', error)
            setUser(null)
            setLoading(false)
          }
        }

        void subscribeProfile()
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
      unsubscribeAuth()
      unsubscribeProfile?.()
    }
  }, [])

  const logout = async () => {
    await auth.signOut()
    setUser(null)
    setFirebaseUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    return {
      user: null,
      firebaseUser: null,
      loading: true,
      logout: async () => {},
    }
  }
  return context
}
