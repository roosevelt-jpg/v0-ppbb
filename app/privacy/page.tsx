import { redirect } from 'next/navigation'
import { CMS_LEGAL_PAGE_URLS } from '@/lib/cms-page-routes'

export default function PrivacyRedirectPage() {
  redirect(CMS_LEGAL_PAGE_URLS.privacyPolicy)
}
