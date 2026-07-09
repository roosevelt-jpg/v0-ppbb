import { redirect } from 'next/navigation'

/** Spec alias — public job board lives at /opportunities */
export default function JobsPage() {
  redirect('/opportunities')
}
