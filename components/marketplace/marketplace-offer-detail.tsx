'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { normalizeDirectoryOffer, isActiveOffer } from '@/lib/marketplace-directory'
import { useAuth } from '@/lib/auth-context'
import { getDmInboxPath } from '@/lib/roles'
import { auth } from '@/lib/firebase'
import { RichTextContent } from '@/components/rich-text-content'
import { BUTTON_PRIMARY, BUTTON_OUTLINE } from '@/lib/admin-design-system'
import { MarketplaceCheckoutPanel } from '@/components/marketplace/marketplace-checkout-panel'
import { PLATFORM_BUSINESS_ID } from '@/lib/marketplace-directory'
import { isPlatformSeller } from '@/lib/pb-payment-policy'

export function MarketplaceOfferDetail() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const offerId = params.id as string
  const { user } = useAuth()
  const [offer, setOffer] = useState<ReturnType<typeof normalizeDirectoryOffer> | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [message, setMessage] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)

  const checkoutStatus = searchParams.get('status')
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (checkoutStatus === 'success') {
      setMessage(
        'Payment successful! Your order is confirmed. The shop was notified to arrange delivery with their partner. Check My Orders for invoice and receipt.'
      )
      setShowCheckout(false)
      if (sessionId) {
        void auth.currentUser?.getIdToken().then((token: string) => {
          if (!token) return
          fetch('/api/marketplace/confirm', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId, offerId }),
          }).catch(() => undefined)
        })
      }
    } else if (checkoutStatus === 'canceled') {
      setMessage('Checkout was canceled. You can try again when ready.')
    }
  }, [checkoutStatus, sessionId, offerId])

  useEffect(() => {
    async function load() {
      try {
        let snap = await getDoc(doc(db, 'offers', offerId))
        if (!snap.exists()) snap = await getDoc(doc(db, 'businessOffers', offerId))
        if (!snap.exists()) {
          setOffer(null)
          return
        }
        const normalized = normalizeDirectoryOffer(snap.id, snap.data() as Record<string, unknown>)
        setOffer(isActiveOffer(normalized) ? normalized : null)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [offerId])

  const handleEnquire = async () => {
    if (!user) {
      router.push(`/login?returnUrl=/marketplace/${offerId}`)
      return
    }
    setActing(true)
    setMessage('')
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch('/api/marketplace/purchase', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offerId, mode: 'enquire', paymentGateway: 'direct' }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      if (json.sellerUserId) {
        const inbox = getDmInboxPath(user)
        router.push(`${inbox}?to=${encodeURIComponent(json.sellerUserId)}`)
        return
      }
      setMessage('Enquiry sent to the business.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setActing(false)
    }
  }

  const startPurchase = () => {
    if (!user) {
      router.push(`/login?returnUrl=/marketplace/${offerId}`)
      return
    }
    setMessage('')
    setShowCheckout(true)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        {loading ? (
          <p className="text-neutral-500">Loading listing…</p>
        ) : !offer ? (
          <div className="text-center py-16">
            <p className="text-lg text-neutral-600 mb-4">Listing not found or unavailable.</p>
            <Link href="/marketplace" className="text-black font-semibold underline">
              Back to marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <Link href="/marketplace" className="text-sm text-neutral-600 hover:text-black">
              ← Back to marketplace
            </Link>

            {offer.images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {offer.images.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="w-full rounded-lg object-cover aspect-square bg-neutral-100"
                  />
                ))}
              </div>
            )}

            <div>
              <p className="text-sm text-neutral-500 capitalize mb-1">{offer.type || offer.category}</p>
              {offer.businessName ? (
                <p className="text-sm text-neutral-600 mb-2">
                  Listed by{' '}
                  {offer.businessId ? (
                    <Link
                      href={`/directory/${offer.businessId}`}
                      className="font-semibold text-[#111111] hover:underline"
                    >
                      {offer.businessName}
                    </Link>
                  ) : (
                    <span className="font-semibold text-[#111111]">{offer.businessName}</span>
                  )}
                </p>
              ) : null}
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 break-words">
                {offer.title}
              </h1>
              <p className="text-xl font-semibold mb-4">
                {offer.price != null ? `AED ${offer.price}` : 'Contact for price'}
              </p>
              {offer.isMemberDiscount && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  {user ? (
                    <p className="text-sm text-amber-900">
                      Member discount: {offer.discountPercentage || offer.memberBenefit || 0}% off
                    </p>
                  ) : (
                    <p className="text-sm text-amber-900">
                      Members-only discount available —{' '}
                      <Link href="/login" className="font-semibold underline">
                        sign in
                      </Link>{' '}
                      to unlock
                    </p>
                  )}
                </div>
              )}
              <RichTextContent
                html={offer.description || 'No description provided.'}
                className="text-neutral-700 prose prose-sm max-w-none"
              />
            </div>

            {offer.businessId && (
              <Link href={`/directory/${offer.businessId}`} className={BUTTON_OUTLINE}>
                View business profile
              </Link>
            )}

            {message && (
              <p
                className={`text-sm ${
                  checkoutStatus === 'canceled' ? 'text-amber-800' : 'text-green-700'
                }`}
              >
                {message}
              </p>
            )}

            {(() => {
              const isPbListing = isPlatformSeller(offer.businessId) || offer.businessId === PLATFORM_BUSINESS_ID
              const priced = offer.price != null && offer.price > 0

              if (priced && !isPbListing) {
                const waDigits = (offer.hostWhatsapp || '').replace(/[^\d+]/g, '')
                const waHref = waDigits
                  ? `https://api.whatsapp.com/send?phone=${waDigits.replace(/^\+/, '')}&text=${encodeURIComponent(
                      `Assalamu alaikum — I want to buy "${offer.title}" on Passive Blessings. Please share payment details.`
                    )}`
                  : null
                return (
                  <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-sm text-neutral-800">
                      This seller collects payment directly. Passive Blessings does not charge you
                      for this listing. After the seller confirms payment, they prepare delivery.
                    </p>
                    {offer.paymentLink ? (
                      <a
                        href={offer.paymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={BUTTON_PRIMARY}
                      >
                        Pay seller
                      </a>
                    ) : null}
                    {waHref ? (
                      <a href={waHref} target="_blank" rel="noopener noreferrer" className={BUTTON_OUTLINE}>
                        WhatsApp seller for payment
                      </a>
                    ) : null}
                    {!offer.paymentLink && !waHref ? (
                      <button
                        type="button"
                        onClick={() => void handleEnquire()}
                        disabled={acting}
                        className={BUTTON_PRIMARY}
                      >
                        {acting ? 'Opening…' : 'Enquire about payment'}
                      </button>
                    ) : null}
                  </div>
                )
              }

              if (showCheckout && priced && user) {
                return (
                  <MarketplaceCheckoutPanel
                    offerId={offerId}
                    price={offer.price!}
                    currency={'AED'}
                    onCancel={() => setShowCheckout(false)}
                    onSuccessMessage={setMessage}
                    getToken={async () => {
                      const t = await auth.currentUser?.getIdToken()
                      return t
                    }}
                  />
                )
              }

              return (
                <button
                  type="button"
                  onClick={priced ? startPurchase : () => void handleEnquire()}
                  disabled={acting}
                  className={BUTTON_PRIMARY}
                >
                  {acting
                    ? 'Processing…'
                    : user
                      ? priced
                        ? 'Buy now'
                        : 'Enquire'
                      : 'Sign in to Purchase / Enquire'}
                </button>
              )
            })()}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
