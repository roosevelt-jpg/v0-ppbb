'use client'

import React from 'react'
import type { EventsFilterTab } from '@/lib/events-config'

interface EventsFilterTabsProps {
  tabs: EventsFilterTab[]
  active: string
  onChange: (filter: string) => void
}

export function EventsFilterTabs({ tabs, active, onChange }: EventsFilterTabsProps) {
  return (
    <div className="w-full overflow-x-auto pb-0.5 -mx-1 px-1">
      <div className="flex gap-1.5 min-w-max sm:min-w-0 sm:flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`min-h-[32px] px-2.5 py-1 rounded-md font-body text-[0.65rem] sm:text-xs font-semibold tracking-wide transition-colors whitespace-nowrap ${
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
