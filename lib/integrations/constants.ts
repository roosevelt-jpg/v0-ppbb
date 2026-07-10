/**
 * Platform-wide owner for integration credentials in Firestore.
 * Integrations are org-level (not per-admin user).
 */
export const INTEGRATION_OWNER_USER_ID = 'dev-user-001'

export function integrationDocId(serviceId: string, userId = INTEGRATION_OWNER_USER_ID): string {
  return `${userId}_${serviceId}`
}
