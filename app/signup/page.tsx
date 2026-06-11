'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const SignupClient = dynamic(() => import('./signup-client'), {
  loading: () => <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', backgroundColor: '#f7f6f2' }}>Loading signup form...</div>,
  ssr: true
})

export default function SignupPage() {
  console.log("[v0] SignupPage rendering")
  return (
    <Suspense fallback={<div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>Loading signup form...</div>}>
      <SignupClient />
    </Suspense>
  )
}
