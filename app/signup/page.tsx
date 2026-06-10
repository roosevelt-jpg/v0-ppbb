'use client'

import dynamic from 'next/dynamic'

const SignupClient = dynamic(() => import('./signup-client'), {
  ssr: false,
  loading: () => <div>Loading...</div>,
})

export default function SignupPage() {
  return <SignupClient />
}
