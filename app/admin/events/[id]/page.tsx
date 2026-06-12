'use client'

import CreateEventPage from '../create/page'

interface PageProps {
  params: { id: string }
}

export default function EditEventPage({ params }: PageProps) {
  return <CreateEventPage params={params} />
}
