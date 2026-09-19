/** Map Firebase Auth error codes to user-friendly login messages. */
function extractAuthParts(error: unknown): { code: string; message: string } {
  if (error == null) return { code: '', message: '' }

  if (typeof error === 'string') {
    return { code: error, message: error }
  }

  if (error instanceof Error) {
    return {
      code: typeof (error as { code?: string }).code === 'string'
        ? String((error as { code?: string }).code)
        : error.message,
      message: error.message || '',
    }
  }

  if (typeof error === 'object') {
    const obj = error as Record<string, unknown>
    const nested =
      obj.error && typeof obj.error === 'object'
        ? (obj.error as Record<string, unknown>)
        : null

    const codeRaw = obj.code ?? nested?.code
    const messageRaw = obj.message ?? nested?.message ?? obj.error

    const code =
      typeof codeRaw === 'string'
        ? codeRaw
        : typeof codeRaw === 'number'
          ? String(codeRaw)
          : ''
    const message =
      typeof messageRaw === 'string'
        ? messageRaw
        : typeof messageRaw === 'number'
          ? String(messageRaw)
          : code

    return { code: code || message, message: message || code }
  }

  return { code: '', message: 'Sign in failed. Please try again.' }
}

export function formatAuthError(error: unknown): string {
  const { code, message } = extractAuthParts(error)
  const haystack = `${code} ${message}`

  if (haystack.includes('auth/invalid-credential') || haystack.includes('auth/wrong-password')) {
    return 'Incorrect email or password. If you signed up with Google, use Continue with Google. Otherwise try Forgot password.'
  }
  if (haystack.includes('auth/user-not-found')) {
    return 'No account found with this email. Sign up first or check the spelling.'
  }
  if (haystack.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.'
  }
  if (haystack.includes('auth/too-many-requests')) {
    return 'Too many attempts. Please wait a few minutes or reset your password.'
  }
  if (haystack.includes('auth/user-disabled')) {
    return 'This account has been disabled. Contact support for help.'
  }
  if (haystack.includes('auth/popup-closed-by-user')) {
    return 'Sign-in was cancelled. Please try again.'
  }
  if (haystack.includes('auth/popup-blocked')) {
    return 'Pop-up was blocked by your browser. Allow pop-ups for this site and try again.'
  }
  if (haystack.includes('auth/operation-not-allowed')) {
    return 'This sign-in method is not enabled yet. Ask an admin to configure it under Integrations and Firebase Authentication.'
  }
  if (haystack.includes('auth/account-exists-with-different-credential')) {
    return 'An account already exists with this email using a different sign-in method. Try Continue with Google, or reset your password.'
  }
  if (haystack.includes('auth/network-request-failed')) {
    return 'Network error. Check your connection and try again.'
  }
  if (
    haystack.includes('Database is closing') ||
    haystack.includes('database connection is closing') ||
    haystack.includes('IndexedDB') ||
    /closing\/hidden/i.test(haystack)
  ) {
    return 'Sign-in storage on this device was interrupted. Close other tabs of this site, refresh the page, and try again.'
  }
  if (haystack.includes('auth/invalid-action-code') || haystack.includes('auth/expired-action-code')) {
    return 'This reset link is invalid or has expired. Request a new password reset email.'
  }
  if (haystack.includes('permission-denied') || haystack.includes('Missing or insufficient permissions')) {
    return 'Signed in, but your profile could not be loaded. Ask an admin to verify your account exists in Firestore, or try again in a moment.'
  }
  if (haystack.includes('auth/unauthorized-domain')) {
    return 'This domain is not authorized for Google Sign-In. Ask an admin to add it in Firebase Authentication → Settings → Authorized domains.'
  }
  if (haystack.includes('auth/internal-error')) {
    return 'Google Sign-In failed due to a configuration issue. Ask an admin to check Google Sign-In under Admin → Integrations and Firebase Authentication.'
  }

  if (message.includes('Firebase:')) {
    return formatAuthError({ code: message })
  }

  // Never surface "[object Object]" to users
  if (!message || message === '[object Object]' || message.trim() === '') {
    return 'Sign in failed. Please try again.'
  }
  if (message.startsWith('[object ')) {
    return 'Sign in failed. Please try again.'
  }
  return message
}
