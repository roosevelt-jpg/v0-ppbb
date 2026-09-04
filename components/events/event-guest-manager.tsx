'use client'

import React from 'react'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import {
  CheckCircle2,
  Download,
  Mail,
  QrCode,
  UserPlus,
  Users,
} from 'lucide-react'
import { ACTION_ROW, BUTTON_BACK, BUTTON_PRIMARY, BUTTON_ROW_COMPACT } from '@/lib/admin-design-system'

type Guest = {
  id: string
  userName?: string
  userEmail?: string
  status?: string
  ticketTypeName?: string
  paymentStatus?: string
  amountPaid?: number
  checkInCode?: string
  checkedInAt?: string | null
  waitlistPosition?: number | null
}

async function authFetch(path: string, options: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error('Not signed in')
  const res = await fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('text/csv')) {
    return { success: true, csv: await res.text() }
  }
  return res.json()
}

const BTN = `${BUTTON_PRIMARY} !text-white text-sm`
const BTN_COMPACT = `${BUTTON_ROW_COMPACT} !text-white`

export function EventGuestManager({
  eventId,
  eventTitle,
  backHref,
}: {
  eventId: string
  eventTitle?: string
  backHref: string
}) {
  const [guests, setGuests] = React.useState<Guest[]>([])
  const [filter, setFilter] = React.useState('all')
  const [loading, setLoading] = React.useState(true)
  const [checkCode, setCheckCode] = React.useState('')
  const [inviteEmails, setInviteEmails] = React.useState('')
  const [addEmail, setAddEmail] = React.useState('')
  const [addName, setAddName] = React.useState('')
  const [message, setMessage] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const qs = filter !== 'all' ? `?status=${filter}` : ''
      const json = await authFetch(`/api/events/${eventId}/guests${qs}`)
      if (json.success) setGuests(json.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [eventId, filter])

  React.useEffect(() => {
    load()
  }, [load])

  const runAction = async (action: string, registrationId?: string) => {
    const json = await authFetch(`/api/events/${eventId}/guests`, {
      method: 'POST',
      body: JSON.stringify({ action, registrationId, userEmail: addEmail, userName: addName }),
    })
    if (json.success) {
      setMessage('Updated')
      setAddEmail('')
      setAddName('')
      load()
    } else {
      setMessage(json.error || 'Action failed')
    }
  }

  const handleCheckIn = async () => {
    const json = await authFetch(`/api/events/${eventId}/check-in`, {
      method: 'POST',
      body: JSON.stringify({ code: checkCode }),
    })
    if (json.success) {
      setMessage(
        json.alreadyCheckedIn
          ? `Already checked in: ${json.data?.userName || ''}`
          : `Checked in: ${json.data?.userName || ''}`
      )
      setCheckCode('')
      load()
    } else {
      setMessage(json.error || 'Check-in failed')
    }
  }

  const handleInvite = async (addDirectly: boolean) => {
    const json = await authFetch(`/api/events/${eventId}/invites`, {
      method: 'POST',
      body: JSON.stringify({ emails: inviteEmails, addDirectly }),
    })
    if (json.success) {
      setMessage(`Processed ${(json.data || []).length} invite(s)`)
      setInviteEmails('')
      if (addDirectly) load()
    } else {
      setMessage(json.error || 'Invite failed')
    }
  }

  const exportCsv = async () => {
    const token = await auth.currentUser?.getIdToken()
    const res = await fetch(`/api/events/${eventId}/guests?format=csv`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `event-${eventId}-guests.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link href={backHref} className={BUTTON_BACK}>
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-black mt-3 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Attendees {eventTitle ? `· ${eventTitle}` : ''}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Pending registrations appear under the <strong>pending</strong> filter — only when the
            event has “Require host approval” turned on. Otherwise guests are confirmed immediately
            with a QR check-in code (no approval email).
          </p>
          <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700 space-y-1.5">
            <p className="font-semibold text-neutral-900">How QR / check-in works</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>After a guest registers (and is approved if required), they get a QR code + check-in code on the confirmation page.</li>
              <li>At the door, paste or scan that code into the Check in box below and click Check in guest.</li>
              <li>Only <strong>confirmed</strong> guests can check in. Pending guests must be approved first.</li>
              <li>Already checked-in guests show a timestamp and cannot be checked in twice.</li>
            </ol>
          </div>
        </div>
        <button type="button" onClick={exportCsv} className={`${BTN} inline-flex items-center gap-2`}>
          <Download className="h-4 w-4 text-white" /> Export CSV
        </button>
      </div>

      {message && (
        <p className="text-sm bg-neutral-100 border rounded-lg px-3 py-2">{message}</p>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="border rounded-xl p-4 bg-white space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <QrCode className="h-4 w-4" /> Check in
          </h2>
          <input
            value={checkCode}
            onChange={(e) => setCheckCode(e.target.value)}
            placeholder="Scan / paste QR token or check-in code"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <button type="button" onClick={handleCheckIn} className={BTN}>
            Check in guest
          </button>
        </div>

        <div className="border rounded-xl p-4 bg-white space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4" /> Invite guests
          </h2>
          <textarea
            value={inviteEmails}
            onChange={(e) => setInviteEmails(e.target.value)}
            rows={3}
            placeholder="Paste emails (comma or newline separated)"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => handleInvite(false)} className={BTN}>
              Send invite links
            </button>
            <button type="button" onClick={() => handleInvite(true)} className={BTN}>
              Add directly (comp)
            </button>
          </div>
        </div>
      </div>

      <div className="border rounded-xl p-4 bg-white space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Add guest manually
        </h2>
        <div className="grid sm:grid-cols-3 gap-2">
          <input
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Name"
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            placeholder="Email"
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <button type="button" onClick={() => runAction('add')} className={BTN}>
            Add guest
          </button>
        </div>
      </div>

      <div className={`${ACTION_ROW} gap-1.5 flex-wrap`}>
        {['all', 'confirmed', 'pending', 'pending_payment', 'waitlisted', 'cancelled'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`${BTN_COMPACT} capitalize ${
              filter === s ? 'ring-2 ring-black ring-offset-1 opacity-100' : 'opacity-70'
            }`}
          >
            {s}
          </button>
        ))}
        <button
          type="button"
          onClick={() => runAction('promote_waitlist')}
          className={BTN_COMPACT}
        >
          Promote next waitlist
        </button>
      </div>

      {loading ? (
        <p className="text-neutral-500">Loading attendees…</p>
      ) : guests.length === 0 ? (
        <p className="text-neutral-500">No attendees yet.</p>
      ) : (
        <div className="overflow-x-auto border rounded-xl bg-white">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="text-left p-3">Attendee</th>
                <th className="text-left p-3">Ticket</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Code</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => (
                <tr key={g.id} className="border-b last:border-0">
                  <td className="p-3">
                    <div className="font-medium">{g.userName || '—'}</div>
                    <div className="text-neutral-500 text-xs">{g.userEmail}</div>
                  </td>
                  <td className="p-3">
                    {g.ticketTypeName || '—'}
                    {g.paymentStatus === 'paid' && g.amountPaid != null && g.amountPaid > 0 ? (
                      <div className="text-xs text-neutral-500">{g.amountPaid} paid</div>
                    ) : g.paymentStatus === 'pending' ? (
                      <div className="text-xs text-amber-600">Awaiting payment</div>
                    ) : null}
                  </td>
                  <td className="p-3">
                    <span className="capitalize">
                      {g.status === 'pending_payment' ? 'Awaiting payment' : g.status}
                    </span>
                    {g.checkedInAt && (
                      <span className="ml-2 inline-flex items-center gap-1 text-green-700 text-xs">
                        <CheckCircle2 className="h-3 w-3" /> in
                      </span>
                    )}
                    {g.waitlistPosition != null && (
                      <div className="text-xs text-neutral-500">#{g.waitlistPosition}</div>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs">{g.checkInCode || '—'}</td>
                  <td className="p-3">
                    <div className={ACTION_ROW}>
                      {g.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            className={BTN_COMPACT}
                            onClick={() => runAction('approve', g.id)}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className={BTN_COMPACT}
                            onClick={() => runAction('reject', g.id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {g.status === 'confirmed' && !g.checkedInAt && (
                        <button
                          type="button"
                          className={BTN_COMPACT}
                          onClick={() => runAction('checkin', g.id)}
                        >
                          Check in
                        </button>
                      )}
                      {g.checkedInAt && (
                        <button
                          type="button"
                          className={BTN_COMPACT}
                          onClick={() => runAction('uncheckin', g.id)}
                        >
                          Undo
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
