'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function BusinessPortal() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user?.role === 'business') {
        router.push('/business/dashboard')
      } else if (user) {
        router.push('/login')
      }
    }
  }, [user, loading, router])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ color: '#888888' }}>Loading business portal...</p>
    </div>
  )
}
