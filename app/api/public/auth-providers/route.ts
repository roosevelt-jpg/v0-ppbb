import { NextResponse } from 'next/server'
import { getAuthProviderPublicConfig } from '@/lib/auth-provider-config-server'

export const dynamic = 'force-dynamic'

/** Public: which OAuth providers are enabled (credentials saved in Integrations). */
export async function GET() {
  try {
    const providers = await getAuthProviderPublicConfig()
    return NextResponse.json({ success: true, data: providers })
  } catch (error) {
    console.error('[auth-providers GET]', error)
    return NextResponse.json(
      {
        success: true,
        data: {
          // Fail open for Google (Firebase Console is source of truth); Facebook stays off.
          google: { enabled: true, configured: false },
          facebook: { enabled: false, configured: false },
        },
      }
    )
  }
}
