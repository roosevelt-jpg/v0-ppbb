# Dashboard Implementation Guide

## Status
- **Authentication Gating:** ✅ DONE - Business Portal link removed from user dashboard
- **Firestore Compliance:** Verified - No client-side Storage SDK, all uploads via APIs
- **Dashboard Pages:** ⚠️ MOST ARE PLACEHOLDERS - Need full implementation

## Pages Status

### User Dashboard (/dashboard/*) - ALL NEED IMPLEMENTATION
- [ ] `/dashboard/events` - Show registered events with real Firestore data
- [ ] `/dashboard/opportunities` - Show applied opportunities from Firestore
- [ ] `/dashboard/donations` - Show donation history with Firestore queries
- [ ] `/dashboard/volunteering` - Show volunteer hours with Firestore data
- [ ] `/dashboard/marketplace` - Show purchases/orders from Firestore
- [ ] `/dashboard/membership` - Show membership status from Firestore
- [ ] `/dashboard/community` - Show joined communities from Firestore
- [ ] `/dashboard/charity-requests` - Show submitted requests from Firestore

### Business Dashboard (/business/*) - NEED VERIFICATION
- [ ] `/business/opportunities` - Show posted jobs/opportunities
- [ ] `/business/offers` - Show posted offers/products
- [ ] `/business/marketplace` - Show product listings
- [ ] `/business/analytics` - Show business analytics
- [ ] `/business/leads` - Show generated leads
- [ ] `/business/referrals` - Show referral commissions

### Admin Pages - NEED TO VERIFY/CREATE
- [ ] `/admin/events` - Manage events (currently exists - verify working)
- [ ] `/admin/opportunities` - Manage opportunities (create if missing)
- [ ] `/admin/marketplace` - Manage marketplace products (create if missing)
- [ ] `/admin/community` - Manage communities (currently exists - verify)
- [ ] `/admin/charity-requests` - Manage beneficiary requests (currently exists - verify)
- [ ] `/admin/memberships` - Manage membership plans (currently exists - verify)

### Public Pages - NEED TO VERIFY SYNC
- [ ] `/events` - Should show data from admin/events in realtime
- [ ] `/opportunities` - Should show data from admin/opportunities in realtime
- [ ] `/marketplace` - Should show data from admin/marketplace in realtime

---

## Implementation Pattern for Dashboard Pages

### Template Code for User Dashboard Page

```typescript
'use client'

import React from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { onSnapshot } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DashboardFeaturePage() {
  const [items, setItems] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) {
      setError('Not authenticated')
      return
    }

    // REALTIME LISTENER (auto-updates when Firestore changes)
    const q = query(
      collection(db, 'collectionName'),
      where('userId', '==', firebaseUser.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setItems(data)
        setError(null)
      } catch (err) {
        console.error('[v0] Error fetching items:', err)
        setError('Failed to load items')
      } finally {
        setLoading(false)
      }
    }, (err) => {
      console.error('[v0] Firestore error:', err)
      setError(err.message)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return <div className="p-8"><p>Loading...</p></div>
  }

  if (error) {
    return <div className="p-8 text-red-600"><p>Error: {error}</p></div>
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Feature Name</h1>
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <p>No items yet</p>
          <Link href="/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <h3 className="font-bold">{item.name || item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
              {/* Add status badge, date, etc. */}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Key Points
1. **Use `onSnapshot` for realtime updates** (not just `getDocs`)
2. **Filter by `userId` or `email`** to get only user's data
3. **Always include error handling** for Firestore failures
4. **Only store URLs in Firestore**, never file bytes
5. **Images/files should be in Firebase Storage**, with URLs in Firestore

---

## Firestore Collections Schema

### Required Collections and Structure

```
users/
  {userId}/
    - email: string
    - firstName: string
    - lastName: string
    - role: string[] // ['member', 'volunteer', 'business']
    - avatarUrl: string // URL to Storage
    - volunteeredHours: number
    - membershipStatus: string
    - createdAt: timestamp

events/
  {eventId}/
    - title: string
    - description: string
    - date: timestamp
    - location: string
    - imageUrl: string // URL to Storage
    - attendees: string[] // [userId1, userId2]
    - ticketType: 'free' | 'paid' | 'rsvp'
    - ticketPrice?: number
    - paymentGateway?: 'stripe' | 'paypal' | 'ziina'
    - createdBy: string // userId
    - status: 'draft' | 'published'

opportunities/
  {opportunityId}/
    - title: string
    - description: string
    - businessId: string
    - applicants: string[] // [userId1, userId2]
    - applications: {
        userId: string
        status: 'pending' | 'accepted' | 'rejected'
        appliedAt: timestamp
      }[]
    - createdAt: timestamp

donations/
  {donationId}/
    - donorId: string
    - amount: number
    - currency: string
    - status: 'completed' | 'pending'
    - receiptUrl?: string // URL to Storage
    - createdAt: timestamp

memberships/
  {membershipId}/
    - userId: string
    - planId: string
    - status: 'active' | 'cancelled'
    - startDate: timestamp
    - renewalDate: timestamp
    - paymentGateway: 'stripe' | 'paypal' | 'ziina'

marketplace/
  {productId}/
    - name: string
    - description: string
    - price: number
    - imageUrl: string // URL to Storage
    - businessId: string
    - orders: string[] // [userId1, userId2]

community/
  {groupId}/
    - name: string
    - description: string
    - members: string[]
    - createdBy: string
    - messages: {
        userId: string
        text: string
        createdAt: timestamp
      }[]

charityRequests/
  {requestId}/
    - userId: string
    - type: string
    - description: string
    - documents: {
        type: string
        url: string // URL to Storage
      }[]
    - status: 'submitted' | 'reviewing' | 'approved' | 'rejected'
```

---

## Critical Implementation Rules

### Golden Rule - Storage
- **Firestore:** Text, numbers, arrays, objects, timestamps ONLY
- **Firebase Storage:** All files (images, PDFs, documents)
- **Firestore Document:** Contains only the URL string to Storage file
- **NEVER:** Store base64, file bytes, or file content in Firestore

### Authentication
- **User Dashboard:** `hasUserAccess(user)` - check user exists with member role
- **Business Dashboard:** `hasBusinessAccess(user)` - check user has business role
- **Admin Pages:** Check `user.roles.includes('admin')` or similar

### Realtime vs Static
- **Dashboard Pages:** Use `onSnapshot()` for realtime updates
- **Public Pages:** Can use `getDocs()` but ideally also realtime
- **Admin Pages:** Use `onSnapshot()` for instant updates

### Data Sync
- Admin creates → Data goes to Firestore
- Public page queries same Firestore collection
- Dashboard page queries same Firestore collection  filtered by user ID
- All three stay in sync automatically

---

## Next Steps

1. **Implement User Dashboard pages** using template above
2. **Verify admin pages exist** and properly save to Firestore
3. **Verify public pages query** same collections as dashboards
4. **Test end-to-end:** Admin creates → Public page shows → Dashboard shows (for user's data)
5. **Implement business dashboard** pages with business-specific data
6. **Test all buttons/forms** save correctly to Firestore with no errors

---

## Debugging Checklist

- [ ] Firestore permissions allow reads/writes
- [ ] User has correct role in Firestore users collection
- [ ] Data is in Firestore (check Firebase Console)
- [ ] Query filters are correct (userId matches)
- [ ] No client-side Storage SDK calls (all via API)
- [ ] Images stored in Storage, URLs in Firestore
- [ ] No hardcoded data arrays (except menus)
- [ ] All components use `onSnapshot` or `getDocs` from Firestore
