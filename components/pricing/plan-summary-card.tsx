'use client'

import React from 'react'
import { Check } from 'lucide-react'
import type { PricingPlan } from '@/lib/pricing-types'
import { formatPlanPrice, getPlanHighlightItems } from '@/lib/pricing-utils'
import { Card } from '@/components/ui/card'

type PlanSummaryCardProps = {
  plan: PricingPlan
  memberCount?: number
  selected?: boolean
  onSelect?: () => void
  showActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
  compact?: boolean
}

/** Clean plan card — short description + up to 4 highlights (no wall of text). */
export function PlanSummaryCard({
  plan,
  memberCount,
  selected,
  onSelect,
  showActions,
  onEdit,
  onDelete,
  compact,
}: PlanSummaryCardProps) {
  const accent = plan.color || '#111111'
  const highlights = getPlanHighlightItems(plan, compact ? 3 : 4)
  const description = plan.description
    ? plan.description.length > 100
      ? `${plan.description.slice(0, 100)}…`
      : plan.description
    : null

  const interactive = Boolean(onSelect)

  return (
    <Card
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect?.()
              }
            }
          : undefined
      }
      className={`relative flex flex-col p-5 border-2 transition-shadow ${
        interactive ? 'cursor-pointer hover:shadow-md' : ''
      } ${selected ? 'ring-2 ring-offset-1' : ''}`}
      style={{
        borderColor: selected ? accent : `${accent}55`,
        backgroundColor: '#ffffff',
        ...(selected ? { ringColor: accent } : {}),
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {plan.icon ? <span className="text-xl leading-none">{plan.icon}</span> : null}
            <h3 className="text-lg font-headline font-bold truncate" style={{ color: accent }}>
              {plan.name}
            </h3>
          </div>
          <p className="text-sm font-semibold mt-1" style={{ color: accent }}>
            {formatPlanPrice(plan)}
            {typeof memberCount === 'number'
              ? ` · ${memberCount} member${memberCount === 1 ? '' : 's'}`
              : ''}
          </p>
          {plan.active === false ? (
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-red-50 text-red-700">
              Inactive
            </span>
          ) : null}
        </div>
        {selected ? (
          <span className="text-xs font-bold shrink-0 px-2 py-1 rounded-full bg-neutral-100 text-neutral-800">
            Selected
          </span>
        ) : null}
      </div>

      {description ? (
        <p className="text-sm text-neutral-600 font-body mb-3 leading-snug">{description}</p>
      ) : null}

      {highlights.length > 0 ? (
        <ul className="space-y-1.5 flex-1">
          {highlights.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-neutral-700 font-body">
              <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: accent }} />
              <span className="leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500 font-body">Edit plan to add highlights.</p>
      )}

      {showActions ? (
        <div className="flex gap-2 pt-4 mt-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.()
            }}
            className="flex-1 px-3 py-2 text-xs font-semibold rounded-md border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.()
            }}
            className="flex-1 px-3 py-2 text-xs font-semibold rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      ) : null}
    </Card>
  )
}
