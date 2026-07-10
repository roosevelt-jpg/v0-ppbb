/**
 * Check if membership is expiring soon (within N days).
 */
export function isExpiringsoon(renewalDate: Date, daysThreshold: number = 30): boolean {
  const now = new Date()
  const diffTime = renewalDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 && diffDays <= daysThreshold
}
