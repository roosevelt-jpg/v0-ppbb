import { redirect } from 'next/navigation'

/** Legacy /contact bookmarks → Partners page (Part 6A). */
export default function ContactRedirectPage() {
  redirect('/partners')
}
