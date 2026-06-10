'use client'

import { useEffect, useState } from 'react'
import { subscribeToLogos, LogoAssets, DEFAULT_LOGOS, getLogoForTheme } from '@/lib/logo-manager'

export function useLogos() {
  const [logos, setLogos] = useState<LogoAssets>(DEFAULT_LOGOS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)

    // Subscribe to real-time updates
    const unsubscribe = subscribeToLogos((updatedLogos) => {
      setLogos(updatedLogos)
      setLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return { logos, loading }
}
