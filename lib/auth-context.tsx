'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setFirebaseUser(currentUser)
          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
          if (userDoc.exists()) {
            setUser(userDoc.data() as User | BusinessProfile)
          }
        } else {
          setFirebaseUser(null)
          setUser(null)
        }
      } catch (error) {
        console.error('[v0] Error fetching user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
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
    // Return a default context instead of throwing to allow for non-auth pages
    return {
      user: null,
      firebaseUser: null,
      loading: true,
      logout: async () => {},
    }
  }
  return context
}
