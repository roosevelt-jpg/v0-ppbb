import { redirect } from 'next/navigation'

const POLICY_SLUG_ALIASES: Record<string, string> = {
  'privacy-policy': 'privacy-policy',
  'terms-of-service': 'terms-of-service',
  'terms-conditions': 'terms-of-service',
  'code-of-conduct': 'code-of-conduct',
}

/** Legacy /policies/* URLs redirect to CMS pages managed in Admin → Pages */
export default async function PolicyRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const target = POLICY_SLUG_ALIASES[slug] || slug
  redirect(`/pages/${target}`)
}
