import { redirect } from 'next/navigation'

/** Legacy URL — CMS page lives at /pages/data-protection */
export default function UAEDataProtectionRedirect() {
  redirect('/pages/data-protection')
}
