'use client'

import React from 'react'
import type { EventsFilterTab } from '@/lib/events-config'
import type { EventsAudienceFilter } from '@/lib/event-utils'

interface EventsFilterTabsProps {
  tabs: EventsFilterTab[]
  active: EventsAudienceFilter
  onChange: (filter: EventsAudienceFilter) => void
}

export function EventsFilterTabs({ tabs, active, onChange }: EventsFilterTabsProps) {
  return (
    <div className="w-full overflow-x-auto pb-1 -mx-1 px-1">
      <div className="flex gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`min-h-[44px] px-4 py-2 rounded-lg font-body text-xs sm:text-sm font-semibold tracking-wide transition-colors whitespace-nowrap ${
              active === tab.id
                ? 'bg-black text-white'
                : 'bg-white text-foreground border border-[#e4e1da] hover:bg-neutral-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
