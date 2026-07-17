'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { useRouter, useParams } from 'next/navigation'

/** Legacy sponsor detail URLs → business members / inquiries model */
export default function AdminSponsorDetailRedirectPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : ''

  React.useEffect(() => {
    router.replace(id ? `/admin/businesses` : '/admin/partnerships')
  }, [router, id])

  return (
    <div className="p-8 text-center text-sm text-neutral-500">
      Redirecting… Sponsors are managed as Business Members.
    </div>
  )
}
