'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { useAuth } from '@/lib/auth-context'
import { auth, db } from '@/lib/firebase'
import { hasAdminAccess } from '@/lib/roles'

type BellItem = {
  id: string
  title: string
  message: string
  href: string
  scope: 'user' | 'admin'
}

function hrefFor(data: Record<string, unknown>, fallback: string): string {
  const href = typeof data.href === 'string' ? data.href : ''
  if (href.startsWith('/')) return href
  const click = typeof data.click_action === 'string' ? data.click_action : ''
  if (click.startsWith('/')) return click
  const type = String(data.type || '')
  if (type === 'beneficiary_request') return '/admin/beneficiary-requests'
  if (type === 'donation_pending') return '/admin/donation-verification'
  if (type === 'event_suggestion') return '/admin/event-suggestions'
  if (type === 'contact') return '/admin/contact-submissions'
  return fallback
}

function toItem(
  id: string,
  data: Record<string, unknown>,
  scope: 'user' | 'admin'
): BellItem | null {
  if (data.read === true || data.dismissed === true) return null
  const title = String(data.title || 'Notification')
  const message = String(data.message || data.body || '')
  return {
    id,
    title,
    message,
    href: hrefFor(data, scope === 'admin' ? '/admin' : '/dashboard'),
    scope,
  }
}

export function NotificationBell({
  onDark = false,
  compact = false,
}: {
  onDark?: boolean
  compact?: boolean
}) {
  const { user } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<BellItem[]>([])
  const rootRef = useRef<HTMLDivElement>(null)
  const admin = hasAdminAccess(user)

  useEffect(() => {
    if (!user?.id) {
      setItems([])
      return
    }

    const buckets: { user: BellItem[]; admin: BellItem[] } = { user: [], admin: [] }
    const publish = () => {
      const merged = [...buckets.admin, ...buckets.user].slice(0, 12)
      setItems(merged)
    }

    const unsubs: Array<() => void> = []

    const listen = (
      scope: 'user' | 'admin',
      path: ReturnType<typeof collection>
    ) => {
      const ordered = query(path, orderBy('createdAt', 'desc'), limit(20))
      const apply = (docs: Array<{ id: string; data: () => Record<string, unknown> }>) => {
        buckets[scope] = docs
          .map((d) => toItem(d.id, d.data() || {}, scope))
          .filter((item): item is BellItem => Boolean(item))
        publish()
      }
      unsubs.push(
        onSnapshot(
          ordered,
          (snap) => apply(snap.docs),
          () => {
            unsubs.push(
              onSnapshot(
                query(path, limit(20)),
                (snap) => apply(snap.docs),
                () => {
                  buckets[scope] = []
                  publish()
                }
              )
            )
          }
        )
      )
    }

    listen('user', collection(db, 'users', user.id, 'notifications'))
    if (admin) listen('admin', collection(db, 'adminNotifications'))

    return () => {
      unsubs.forEach((fn) => fn())
    }
  }, [user?.id, admin])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [open])

  if (!user?.id) return null

  const markRead = async (item: BellItem) => {
    setItems((current) => current.filter((row) => !(row.scope === item.scope && row.id === item.id)))
    setOpen(false)
    try {
      if (item.scope === 'user') {
        await updateDoc(doc(db, 'users', user.id, 'notifications', item.id), { read: true })
      } else {
        const token = await auth.currentUser?.getIdToken()
        if (token) {
          await fetch('/api/notifications/read', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: item.id, scope: 'admin' }),
          })
        }
      }
    } catch {
      /* bell still navigates */
    }
    router.push(item.href)
  }

  const buttonClass = onDark
    ? compact
      ? 'relative inline-flex items-center justify-center min-h-[28px] min-w-[28px] rounded-md p-1 bg-transparent text-white hover:bg-white/10'
      : 'relative inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg p-2 bg-transparent text-white hover:bg-white/10'
    : compact
      ? 'relative inline-flex items-center justify-center min-h-[28px] min-w-[28px] rounded-md p-1 bg-transparent text-neutral-800 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800'
      : 'relative inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg p-2 bg-transparent text-neutral-800 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800'

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        data-dashboard-control
        className={`pb-ghost-btn ${buttonClass}`}
        aria-label={items.length ? `${items.length} notifications` : 'Notifications'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className={compact ? 'h-3.5 w-3.5' : 'h-5 w-5'} aria-hidden />
        {items.length > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-4 text-center">
            {items.length > 9 ? '9+' : items.length}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-[80] mt-2 w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-xl">
          <div className="px-3 py-2 border-b border-neutral-200">
            <p className="text-sm font-semibold text-neutral-900">Notifications</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-sm text-neutral-600 text-center">You&apos;re all caught up.</p>
            ) : (
              items.map((item) => (
                <button
                  key={`${item.scope}-${item.id}`}
                  type="button"
                  data-menu-item
                  onClick={() => void markRead(item)}
                  className="block w-full text-left px-3 py-3 border-b border-neutral-100 hover:bg-neutral-50 bg-white"
                >
                  <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                  {item.message ? (
                    <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{item.message}</p>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
