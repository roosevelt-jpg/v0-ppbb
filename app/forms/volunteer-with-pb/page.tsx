import { redirect } from 'next/navigation'

/** Alias for the seeded volunteer form slug. */
export default function VolunteerWithPbAliasPage() {
  redirect('/forms/volunteer-unpaid-service')
}
