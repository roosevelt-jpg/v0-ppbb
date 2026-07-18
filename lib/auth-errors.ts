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
  if (code.includes('auth/popup-closed-by-user')) {
    return 'Sign-in was cancelled. Please try again.'
  }
  if (code.includes('auth/popup-blocked')) {
    return 'Pop-up was blocked by your browser. Allow pop-ups for this site and try again.'
  }
  if (code.includes('auth/operation-not-allowed')) {
    return 'This sign-in method is not enabled yet. Ask an admin to configure it under Integrations and Firebase Authentication.'
  }
  if (code.includes('auth/account-exists-with-different-credential')) {
    return 'An account already exists with this email using a different sign-in method. Try Continue with Google, or reset your password.'
  }
  if (code.includes('auth/network-request-failed')) {
    return 'Network error. Check your connection and try again.'
  }
  if (code.includes('auth/invalid-action-code') || code.includes('auth/expired-action-code')) {
    return 'This reset link is invalid or has expired. Request a new password reset email.'
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
