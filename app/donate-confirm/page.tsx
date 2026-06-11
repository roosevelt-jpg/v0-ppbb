'use client'

import { Suspense } from 'react'
import DonateConfirmContent from './content'

export default function DonateConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <DonateConfirmContent />
    </Suspense>
  )
}
