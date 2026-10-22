'use client'

import React from 'react'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { parseDoorScanToken } from '@/lib/event-check-in-link'

type ScanResult = {
  userName?: string
  eventTitle?: string
  payment?: string
  attendance?: string
  volunteerNote?: string | null
  alreadyCheckedIn?: boolean
}

export default function AdminScanPage() {
  const { firebaseUser, loading: authLoading } = useAuth()
  const [code, setCode] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')
  const [result, setResult] = React.useState<ScanResult | null>(null)
  const [cameraOn, setCameraOn] = React.useState(true)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const scanned = React.useRef(false)

  const submit = React.useCallback(async (raw: string) => {
    const token = parseDoorScanToken(raw)
    if (!token || scanned.current) return
    scanned.current = true
    setBusy(true)
    setError('')
    try {
      const idToken = await auth.currentUser?.getIdToken()
      if (!idToken) {
        setError('Sign in as an admin, then scan again.')
        scanned.current = false
        return
      }
      const res = await fetch('/api/admin/scan', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: token }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || 'Scan failed')
        scanned.current = false
        return
      }
      setResult(json)
      setCameraOn(false)
    } catch (err) {
      console.error('[admin/scan]', err)
      setError('Scan failed. Try again.')
      scanned.current = false
    } finally {
      setBusy(false)
    }
  }, [])

  React.useEffect(() => {
    if (authLoading || !firebaseUser) return
    const params = new URLSearchParams(window.location.search)
    const token = params.get('t') || params.get('token')
    if (token) void submit(token)
  }, [authLoading, firebaseUser, submit])

  React.useEffect(() => {
    if (!cameraOn) return
    let stream: MediaStream | null = null
    let timer = 0
    let stopped = false

    const attach = async (next: MediaStream) => {
      stream = next
      if (stopped || !videoRef.current) {
        next.getTracks().forEach((track) => track.stop())
        return false
      }
      setError('')
      videoRef.current.srcObject = next
      await videoRef.current.play()
      return true
    }

    void (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraOn(false)
          setError('This browser cannot open the camera. Scan the QR with the phone’s camera app.')
          return
        }
        // ideal, not exact: a laptop has no rear camera, and an exact rear-camera
        // request fails before the browser can ask for permission.
        let next: MediaStream
        try {
          next = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: { ideal: 'environment' } },
          })
        } catch (err) {
          const name = err instanceof DOMException ? err.name : ''
          if (name !== 'OverconstrainedError' && name !== 'NotFoundError') throw err
          next = await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
        }
        if (!(await attach(next)) || stopped) return

        const Detector = (window as unknown as {
          BarcodeDetector?: new (opts: { formats: string[] }) => {
            detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>
          }
        }).BarcodeDetector
        if (!Detector || !videoRef.current) return
        const detector = new Detector({ formats: ['qr_code'] })
        timer = window.setInterval(() => {
          if (!videoRef.current || scanned.current) return
          void detector
            .detect(videoRef.current)
            .then((codes) => {
              const value = codes[0]?.rawValue
              if (value) void submit(value)
            })
            .catch(() => undefined)
        }, 500)
      } catch (err) {
        if (stopped) return
        console.error('[admin/scan] camera', err)
        const name = err instanceof DOMException ? err.name : ''
        setCameraOn(false)
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setError('Camera permission was blocked. Allow the camera for this site, then tap Open camera.')
          return
        }
        setError('The camera could not start. Tap Open camera and allow it when the browser asks.')
      }
    })()

    return () => {
      stopped = true
      window.clearInterval(timer)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [cameraOn, submit])

  const paymentLine =
    result?.payment === 'confirmed_now'
      ? 'Payment confirmed at the door.'
      : result?.payment === 'already_paid'
        ? 'Payment was already received.'
        : result
          ? 'No payment was due.'
          : ''

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Scan guest QR</h1>
      <p className="text-sm text-neutral-600">
        Open your phone camera and point it at the guest’s QR code, or scan it here. A scan
        confirms payment and attendance. Thursday volunteering hours start when the QR is scanned.
      </p>

      {result ? (
        <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-950 space-y-1">
          <p className="font-semibold">{result.userName} · {result.eventTitle}</p>
          <p>{result.alreadyCheckedIn ? 'Already checked in.' : 'Attendance confirmed.'}</p>
          <p>{paymentLine}</p>
          {result.volunteerNote ? <p>{result.volunteerNote}</p> : null}
          <button
            type="button"
            className="mt-2 underline"
            onClick={() => {
              scanned.current = false
              setResult(null)
              setCode('')
            }}
          >
            Scan another guest
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {cameraOn ? (
        <div className="space-y-2">
          <video ref={videoRef} className="min-h-64 w-full rounded-xl bg-black" muted playsInline />
          <p className="text-sm text-neutral-600">
            Allow the camera when the browser asks. The camera opens as soon as you allow it.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            scanned.current = false
            setCameraOn(true)
          }}
          className="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white"
        >
          Open camera
        </button>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          scanned.current = false
          void submit(code)
        }}
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Or paste the code"
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Checking…' : 'Confirm'}
        </button>
      </form>
    </div>
  )
}
