'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const SignupClient = dynamic(() => import('./signup-client'), {
  loading: () => <div className="min-h-screen flex items-center justify-center">Loading...</div>,
  ssr: false
})

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignupClient />
    </Suspense>
  )
}
