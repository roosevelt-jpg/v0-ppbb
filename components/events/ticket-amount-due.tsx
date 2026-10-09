'use client'

export function TicketAmountDue({
  amount,
  currency,
}: {
  amount?: number | null
  currency?: string | null
}) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return null
  const code = String(currency || 'AED').toUpperCase()
  const formatted = Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2)
  return (
    <div className="mb-4 flex items-baseline justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
      <span className="text-sm text-neutral-600">Amount due</span>
      <span className="text-xl font-bold text-neutral-900">
        {code} {formatted}
      </span>
    </div>
  )
}
