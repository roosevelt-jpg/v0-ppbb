export async function GET() {
  // Return default favicon - runtime will fetch from Firestore if needed
  const defaultFavicon =
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/favicon-rTk4mN9xK2pL8vQwE6jH3sY1zB5cDfG.png'

  return new Response(null, {
    status: 302,
    headers: {
      Location: defaultFavicon,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}

