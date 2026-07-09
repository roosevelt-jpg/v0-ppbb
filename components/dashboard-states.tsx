'use client'

import React from 'react'
import Link from 'next/link'

/** Override global `button { bg-black text-white }` for dashboard tab/pill controls */
export function DashboardTabButton({
  active,
  children,
  onClick,
  className = '',
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-none ${
        active
          ? '!bg-black !text-white hover:!bg-neutral-800'
          : '!bg-white !text-black border border-gray-300 hover:!bg-gray-50'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function DashboardPageShell({
  title,
  subtitle,
  children,
  action,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 sm:mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 whitespace-normal">{title}</h1>
          {subtitle ? <p className="text-sm sm:text-base text-neutral-500 mt-2">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </div>
  )
}

export function DashboardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 bg-neutral-200 rounded w-48" />
      <div className="h-4 bg-neutral-100 rounded w-72" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-neutral-100 rounded-xl" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-24 bg-neutral-100 rounded-xl" />
      ))}
    </div>
  )
}

export function DashboardErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 p-8 text-center">
      <div className="text-4xl" aria-hidden>
        ⚠️
      </div>
      <h2 className="text-xl font-semibold text-neutral-900">This page couldn&apos;t load</h2>
      <p className="text-neutral-500 text-sm max-w-sm">{message}</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          onClick={onRetry ?? (() => window.location.reload())}
          className="!bg-black !text-white px-6 py-2 rounded-lg text-sm"
        >
          Try Again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center !bg-white !text-black border border-gray-300 px-6 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}

export function DashboardEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 border border-neutral-200 rounded-xl bg-white text-center">
      {icon ? <div className="mb-4 text-neutral-300">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-neutral-800 mb-2">{title}</h3>
      <p className="text-sm text-neutral-500 max-w-md mb-6">{description}</p>
      {action}
    </div>
  )
}
