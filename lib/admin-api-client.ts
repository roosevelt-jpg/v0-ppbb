import { auth } from '@/lib/firebase'

export type AdminApiJson<T = unknown> = {
  success: boolean
  error?: string
  data?: T
  url?: string
  canViewSensitiveDocuments?: boolean
}

/** Authenticated fetch for admin API routes with safe JSON parsing. */
export async function adminApiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<AdminApiJson<T>> {
  const user = auth.currentUser
  if (!user) {
    return { success: false, error: 'Not signed in' }
  }

  const token = await user.getIdToken()
  const res = await fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return {
      success: false,
      error: res.ok
        ? 'Server returned an invalid response. Try refreshing the page.'
        : `Request failed (${res.status}). The API may be unavailable — using fallback where possible.`,
    }
  }

  try {
    return (await res.json()) as AdminApiJson<T>
  } catch {
    return { success: false, error: 'Failed to parse server response' }
  }
}
