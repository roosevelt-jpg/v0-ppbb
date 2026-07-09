import { redirect } from 'next/navigation'
import { CMS_LEGAL_PAGE_URLS } from '@/lib/cms-page-routes'

export default function TermsRedirectPage() {
  redirect(CMS_LEGAL_PAGE_URLS.termsOfService)
}
