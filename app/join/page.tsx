import { redirect } from 'next/navigation'

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const params = await searchParams
  if (params?.type === 'business') {
    redirect('/signup?type=business')
  }
  redirect('/signup')
}
