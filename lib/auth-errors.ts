/** Map Firebase Auth error codes to user-friendly login messages. */
export function formatAuthError(error: unknown): string {
  const code =
    (error as { code?: string })?.code ||
    (typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: string }).message || '')
      : '')

  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password')) {
    return 'Incorrect email or password. If you signed up with Google, use Continue with Google. Otherwise try Forgot password.'
  }
  if (code.includes('auth/user-not-found')) {
    return 'No account found with this email. Sign up first or check the spelling.'
  }
  if (code.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.'
  }
  if (code.includes('auth/too-many-requests')) {
    return 'Too many attempts. Please wait a few minutes or reset your password.'
  }
  if (code.includes('auth/user-disabled')) {
    return 'This account has been disabled. Contact support for help.'
  }
  if (code.includes('permission-denied') || code.includes('Missing or insufficient permissions')) {
    return 'Signed in, but your profile could not be loaded. Ask an admin to verify your account exists in Firestore, or try again in a moment.'
  }

  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('Firebase:')) {
    return formatAuthError({ code: message })
  }
  return message || 'Sign in failed. Please try again.'
}
