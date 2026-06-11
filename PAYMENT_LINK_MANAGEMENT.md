# Payment Link Management System

## Overview
The Passive Blessings donation system supports dynamic payment link management. Admin can update charity partner payment links at any time, and changes are reflected in real-time across all platforms.

## Where Payment Links Are Used

### 1. Public Donation Page (`/donate`)
- Shows all active charity partners
- Each partner displays their current payment link from Firestore
- Real-time updates via `onSnapshot()` listener
- When admin updates a partner's payment link, it appears instantly

### 2. Donation Confirmation Flow (`/donate-confirm`)
- Fetches the payment link from the URL parameters (passed from `/donate`)
- Redirects users to the partner's payment page
- User completes payment on partner's website
- User returns to upload proof of payment

### 3. Member Dashboard (`/dashboard/donations`)
- Shows donation history with partner names
- Partners are linked to their verification records
- Admin can verify donations and update partner attribution

### 4. Admin Partner Management (`/admin/partners`)
- **NEW FEATURE:** Click "Edit" on any partner to open edit modal
- Update payment link anytime
- Changes apply immediately across all pages
- No downtime or rebuild required

### 5. Homepage (`/`)
- "Donate Now" button links to `/donate` (public page)
- Shows available partners from Firestore
- Links to all current partner payment options

## Updating Payment Links

### Step-by-Step Guide

1. **Navigate to Admin Dashboard**
   - Go to `/admin` (must be logged in as admin)

2. **Click "Charity Partners"**
   - Access `/admin/partners`

3. **Find the Partner to Update**
   - Locate the partner (e.g., Beit Al Khair)
   - Click the "Edit" button in the Actions column

4. **Update Payment Link**
   - The edit modal opens
   - Scroll to "Payment Link" field
   - Paste the new payment link URL
   - Other fields can also be updated (description, logo, etc.)

5. **Save Changes**
   - Click "Save Changes" button
   - Changes are saved to Firestore immediately
   - Modal closes automatically

6. **Verify Changes (Optional)**
   - Visit `/donate` page in public view
   - Confirm the updated partner shows the new payment link
   - Changes are visible instantly to all users

## Real-Time Sync Architecture

```
Admin Updates Payment Link
         ↓
Firestore Collection Updated (charityPartners)
         ↓
onSnapshot() Listeners Triggered
         ↓
All Pages Updated Simultaneously:
├── /donate (public)
├── /donate-confirm (payment flow)
├── /dashboard/donations (member)
└── /admin/partners (admin)
```

## Features

✅ **Instant Updates** - No page refresh needed
✅ **Real-Time Sync** - All dashboards update automatically
✅ **No Downtime** - Changes apply immediately
✅ **Easy to Use** - Simple edit modal UI
✅ **Audit Trail** - `updatedAt` timestamp recorded
✅ **Multiple Partners** - Support different partners for different causes
✅ **Partner Status** - Can activate/deactivate partners

## Firestore Collection: charityPartners

```javascript
{
  id: "partner_id",
  name: "Beit Al Khair",
  description: "Official charity organization",
  website: "https://www.beitalhkair.ae",
  paymentLink: "https://donate.beitalhkair.ae/passive-blessings", // UPDATE THIS
  logo: "https://cdn.example.com/logo.png",
  status: "active", // or "inactive"
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Best Practices

1. **Always Test New Links**
   - Before updating payment links in production
   - Verify the link works correctly

2. **Keep Descriptions Updated**
   - Update partner description when link changes
   - Helps users understand the partner

3. **Maintain Multiple Partners**
   - Keep backup partners active
   - Easy to switch if primary goes down

4. **Monitor Payment Links**
   - Check links periodically
   - Update immediately if partner changes URL

5. **Record Changes**
   - Note timestamp of updates
   - Document reason for link change if needed

## Troubleshooting

**Payment Link Not Updating?**
- Refresh the page (browser cache)
- Check partner status is "active"
- Verify Firestore write permissions

**Link Not Working?**
- Test the URL directly in browser
- Confirm partner website is accessible
- Update with correct partner link

**Old Link Still Showing?**
- Clear browser cache
- Check Firestore for latest update
- Verify onSnapshot listener is active

## API Reference

See `/lib/donation-queries.ts` for helper functions:

```typescript
// Get all active partners (real-time)
subscribeToActivePartners(callback)

// Get default/primary partner
getPrimaryPartner()

// Get specific partner (real-time)
subscribeToPartner(partnerId, callback)

// Get all active causes
subscribeToActiveCauses(callback)
```

## Summary

The payment link management system is fully automated and real-time. Admin can update links anytime from the admin panel, and all pages (public, member, admin) update instantly without requiring any manual intervention or page reloads. This ensures seamless donation flows even when switching between multiple charity partners.
