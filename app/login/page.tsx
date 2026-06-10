'use client'

import dynamic from 'next/dynamic'

const LoginClient = dynamic(() => import('./login-client'), {
  ssr: false,
  loading: () => <div>Loading...</div>,
})

export default function LoginPage() {
  return <LoginClient />
}
