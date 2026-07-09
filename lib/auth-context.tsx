'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, onSnapshot, getDoc } from 'firebase/firestore'
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth'
import { User, BusinessProfile } from '@/lib/types'
import { isAccountDeleted } from '@/lib/user-settings'

interface AuthContextType {
  user: User | BusinessProfile | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
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
                  const profile = { id: snap.id, ...snap.data() } as User | BusinessProfile
                  if (isAccountDeleted(profile)) {
                    setUser(null)
                    setLoading(false)
                    void signOut(auth)
                    return
                  }
                  setUser(profile)
                } else {
                  setUser(null)
                }
                setLoading(false)
              },
              (error) => {
                const code = (error as { code?: string })?.code
                if (code === 'permission-denied') {
                  // Retry once with getDoc after token propagation
                  void getDoc(doc(db, 'users', uid))
                    .then((snap) => {
                      if (snap.exists()) {
                        const profile = { id: snap.id, ...snap.data() } as User | BusinessProfile
                        if (!isAccountDeleted(profile)) setUser(profile)
                      }
                      setLoading(false)
                    })
                    .catch(() => {
                      setUser(null)
                      setLoading(false)
                    })
                  return
                }
                console.warn('[v0] User profile subscription error:', error)
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

  const refreshUser = useCallback(async () => {
    const current = auth.currentUser
    if (!current) return
    try {
      await current.getIdToken(true)
      const snap = await getDoc(doc(db, 'users', current.uid))
      if (snap.exists()) {
        const profile = { id: snap.id, ...snap.data() } as User | BusinessProfile
        if (!isAccountDeleted(profile)) {
          setUser(profile)
        }
      }
    } catch (error) {
      console.error('[v0] refreshUser failed:', error)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, logout, refreshUser }}>
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
      refreshUser: async () => {},
    }
  }
  return context
}
