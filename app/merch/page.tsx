import { redirect } from 'next/navigation'

/** Alias for /shop — keep a single merch storefront. */
export default function MerchRedirect() {
  redirect('/shop')
}
