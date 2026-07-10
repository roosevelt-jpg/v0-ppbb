'use client'

import type { Page } from '@/lib/types'

const POLL_MS = 12_000

async function fetchMenuPages(menuLocation: string): Promise<Page[]> {
  try {
    const res = await fetch(`/api/pages?menuLocation=${encodeURIComponent(menuLocation)}`, {
      cache: 'no-store',
    })
    const json = await res.json()
    return json.success ? (json.data as Page[]) : []
  } catch {
    return []
  }
}

/** Live menu updates via API polling (Admin SDK reads; no client Firestore dependency). */
export function subscribeToMenuPages(
  menuLocation: string,
  onUpdate: (pages: Page[]) => void
): () => void {
  let active = true

  const load = async () => {
    if (!active) return
    const pages = await fetchMenuPages(menuLocation)
    if (active) onUpdate(pages)
  }

  void load()
  const timer = window.setInterval(load, POLL_MS)

  return () => {
    active = false
    window.clearInterval(timer)
  }
}

let ensurePromise: Promise<void> | null = null

export async function ensureMenuPagesSeeded(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = fetch('/api/pages/ensure-menu', { cache: 'no-store' })
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        ensurePromise = null
      })
  }
  return ensurePromise
}
