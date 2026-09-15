import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { requireAdminFromRequest } from '@/lib/admin-api-auth'
import { getSignedReadUrl } from '@/lib/storage-server'
import { parseStorageObject } from '@/lib/media-url'

/**
 * GET /api/admin/donation-proof?submissionId=...
 * Returns a short-lived signed URL for a private donation-proofs object.
 */
export async function GET(request: NextRequest) {
  try {
    const uid = await requireAdminFromRequest(request, {
      permission: ['manage_beneficiary'],
    })
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const submissionId = String(request.nextUrl.searchParams.get('submissionId') || '').trim()
    if (!submissionId) {
      return NextResponse.json({ success: false, error: 'submissionId required' }, { status: 400 })
    }

    const snap = await getAdminDb().collection('donationSubmissions').doc(submissionId).get()
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    const data = snap.data() || {}
    const raw = String(data.proofImage || data.proofUrl || data.proofStoragePath || '').trim()
    if (!raw) {
      return NextResponse.json({ success: false, error: 'No proof on file' }, { status: 404 })
    }

    const parsed = parseStorageObject(raw)
    const path =
      parsed?.objectPath ||
      (raw.startsWith('donation-proofs/') ? raw : null) ||
      (raw.includes('/') && !/^https?:\/\//i.test(raw) ? raw : null)

    if (!path || !path.replace(/^\/+/, '').startsWith('donation-proofs/')) {
      // Non-private / unexpected URL — return as-is for legacy public proofs
      if (/^https?:\/\//i.test(raw)) {
        return NextResponse.json({ success: true, url: raw })
      }
      return NextResponse.json({ success: false, error: 'Invalid proof path' }, { status: 400 })
    }

    const url = await getSignedReadUrl(path, 1)
    return NextResponse.json({ success: true, url })
  } catch (error) {
    console.error('[admin/donation-proof]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load proof' },
      { status: 500 }
    )
  }
}
