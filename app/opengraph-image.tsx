import { ImageResponse } from 'next/og'
import { DEFAULT_LOGO_ON_LIGHT_BG } from '@/lib/brand-assets'

export const runtime = 'edge'
export const alt = 'Passive Blessings'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  let logoSrc = DEFAULT_LOGO_ON_LIGHT_BG
  try {
    const logoRes = await fetch(DEFAULT_LOGO_ON_LIGHT_BG)
    if (logoRes.ok) {
      const bytes = new Uint8Array(await logoRes.arrayBuffer())
      let binary = ''
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
      logoSrc = `data:image/png;base64,${btoa(binary)}`
    }
  } catch {
    // Fall back to remote URL if fetch fails
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f7f6f2',
          gap: 28,
        }}
      >
        <img
          src={logoSrc}
          alt="Passive Blessings"
          width={420}
          height={420}
          style={{ objectFit: 'contain' }}
        />
        <div
          style={{
            display: 'flex',
            fontSize: 42,
            fontWeight: 600,
            color: '#111111',
            letterSpacing: '-0.02em',
          }}
        >
          Passive Blessings
        </div>
      </div>
    ),
    { ...size }
  )
}
