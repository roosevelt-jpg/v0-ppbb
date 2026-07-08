'use client'

import { Suspense } from 'react'
import SignupClient from './signup-client-fixed'

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-body text-neutral-500">
          Loading…
        </div>
      }
    >
      <SignupClient />
    </Suspense>
  )
}
