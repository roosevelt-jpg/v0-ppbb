'use client'

import React, { useMemo } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { EventsCategory } from '@/lib/events-config'
import { getCategoryColor } from '@/lib/events-config'
import type { NormalizedEvent } from '@/lib/event-utils'
import { getEventStartDate } from '@/lib/event-utils'

interface EventsCalendarProps {
  month: Date
  onMonthChange: (month: Date) => void
  events: NormalizedEvent[]
  categories: EventsCategory[]
  selectedDate: Date | null
  onSelectDate: (date: Date | null) => void
}

export function EventsCalendar({
  month,
  onMonthChange,
  events,
  categories,
  selectedDate,
  onSelectDate,
}: EventsCalendarProps) {
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [month])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, NormalizedEvent[]>()
    for (const event of events) {
      const start = getEventStartDate(event)
      const key = format(start, 'yyyy-MM-dd')
      const list = map.get(key) || []
      list.push(event)
      map.set(key, list)
    }
    return map
  }, [events])

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white rounded-xl border border-[#e4e1da] p-3 sm:p-4 max-w-xl mx-auto w-full min-w-0">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="font-headline text-base sm:text-lg font-bold text-foreground break-words">
          {format(month, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onMonthChange(subMonths(month, 1))}
            className="flex items-center justify-center h-8 w-8 rounded-md border border-[#e4e1da] hover:bg-neutral-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(new Date())}
            className="h-8 px-2.5 rounded-md border border-[#e4e1da] hover:bg-neutral-50 font-body text-[0.65rem] sm:text-xs font-medium"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, 1))}
            className="flex items-center justify-center h-8 w-8 rounded-md border border-[#e4e1da] hover:bg-neutral-50"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center font-body text-[0.6rem] sm:text-[0.65rem] font-semibold text-muted-foreground py-0.5"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.slice(0, 1)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {calendarDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDay.get(key) || []
          const inMonth = isSameMonth(day, month)
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
          const isToday = isSameDay(day, new Date())

          return (
            <button
              key={key}
              type="button"
              data-calendar-day
              onClick={() => onSelectDate(isSelected ? null : day)}
              className={`relative min-h-[34px] sm:min-h-[40px] rounded-md p-0.5 sm:p-1 text-left transition-colors bg-white border border-[#e4e1da] shadow-none font-normal ${
                inMonth ? 'text-[#111111]' : 'text-[#888888]'
              } ${
                isSelected
                  ? 'ring-2 ring-[#111111] bg-[#f7f6f2]'
                  : isToday
                    ? 'bg-[#f7f6f2] ring-1 ring-[#111111]'
                    : 'hover:bg-[#f7f6f2]'
              }`}
            >
              <span className="block font-body text-[0.7rem] sm:text-xs font-medium leading-none">
                {format(day, 'd')}
              </span>
              {dayEvents.length > 0 && (
                <div className="mt-0.5 flex flex-wrap gap-0.5 justify-center sm:justify-start max-w-full">
                  {dayEvents.slice(0, 3).map((event) => (
                    <span
                      key={event.id}
                      className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: getCategoryColor(categories, event.category),
                      }}
                      title={event.title}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[0.5rem] opacity-70">+</span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center gap-1 min-w-0">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: category.color }}
            />
            <span className="font-body text-[0.6rem] sm:text-[0.65rem] text-muted-foreground truncate">
              {category.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
