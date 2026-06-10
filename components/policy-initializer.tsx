'use client'

import { useEffect } from 'react'
import { initializePolicies } from '@/lib/policy-manager'

export function PolicyInitializer() {
  useEffect(() => {
    const init = async () => {
      try {
        await initializePolicies()
        console.log('[v0] Policies initialized successfully')
      } catch (error) {
        console.error('[v0] Error initializing policies:', error)
      }
    }

    init()
  }, [])

  return null
}
