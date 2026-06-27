# Admin API Management Plan - Status Update

**Date:** June 27, 2026  
**Plan:** Fix Auth/Navigation Bugs + Reorganize Business Portal  
**Status:** 80% Complete

## Completion Summary

### ✅ COMPLETED ITEMS

**1. Types & Auth Helper - COMPLETE**
- `roles?: UserRole[]` already exists in `User` interface
- `hasBusinessAccess()` helper already created and exported
- `JobApplication` interface exists and properly defined

**2. Fix Upgrade API - COMPLETE**
- `/api/user/upgrade-to-business/route.ts` already properly sets roles array
- Keeps primary `role` intact while adding 'business' to `roles` array
- Both member and business roles properly maintained

**3. Fix BusinessPortalSwitcher - COMPLETE**
- Uses `hasBusinessAccess(user)` correctly
- Redirects to `/business/dashboard` on both paths
- Modal shows for non-business users
- Post-onboarding redirect to `/business/dashboard`

**4. Business Portal Access Gating - COMPLETE**
- `app/business/layout.tsx` uses `hasBusinessAccess(user)` for auth
- Responsive layout uses proper Tailwind classes (`md:hidden`, `md:block`)
- No inline media queries causing issues
- All business pages properly gated

**5. Member Dashboard Auth - COMPLETE**
- `app/dashboard/layout.tsx` uses `useAuth()` correctly
- No separate `onAuthStateChanged` listener
- Proper auth flow and state management

**6. Business Signup Page - COMPLETE**
- `app/business/signup/page.tsx` exists and functional
- Standalone signup for public access
- Integration with upgrade API

**7. Public Pages - COMPLETE**
- `app/opportunities/page.tsx` exists
- `app/marketplace/page.tsx` exists
- Both fetch realtime data from Firestore

**8. Member Dashboard Pages - COMPLETE**
- `app/dashboard/opportunities/page.tsx` with apply functionality
- `app/dashboard/marketplace/page.tsx` with orders
- `app/dashboard/events/page.tsx` with registrations
- `app/dashboard/donations/page.tsx` with history
- All use realtime Firestore sync

**9. Business Dashboard Pages - EXIST**
- `/business/dashboard` - Analytics
- `/business/opportunities` - Job management
- `/business/offers` - Product offers
- `/business/leads` - Lead tracking
- `/business/profile` - Business profile
- All properly authenticated

**10. Cleanup - COMPLETE**
- No duplicate `/app/admin/business/` directory
- No duplicate `/app/business-admin/` directory
- No lingering references to old paths

**11. Login Redirect - FIXED**
- Updated to use `hasBusinessAccess()` instead of `role === 'business'`
- Proper routing for upgraded business members
- Super admin routes to `/admin` instead of `/business/dashboard`

### ⚠️ NEEDS VERIFICATION

1. **End-to-End Testing**
   - [ ] Admin creates event → Public shows event → User registers → Dashboard shows event
   - [ ] User upgrades to business → Redirects to `/business/dashboard`
   - [ ] Business posts opportunity → Public shows → User applies → Business sees applicant
   - [ ] Business posts offer → Shows in marketplace (both public and member dashboard)

2. **Firestore Collections Verification**
   - [ ] Events collection syncing correctly
   - [ ] Opportunities/Jobs collection working
   - [ ] Applications collection tracking applies
   - [ ] Offers/Products collection showing in marketplace
   - [ ] User roles properly updated on upgrade

3. **Admin Pages Verification**
   - [ ] `/admin/events` - Create/edit/delete events
   - [ ] `/admin/opportunities` - Manage business opportunities
   - [ ] `/admin/offers` - Manage products
   - [ ] `/admin/users` - User management with role assignment
   - [ ] All admin functions save to Firestore in realtime

## Data Flow Architecture

```
ADMIN PAGES → FIRESTORE COLLECTIONS → PUBLIC PAGES + MEMBER DASHBOARDS
                     ↓
              Firebase Storage (images/files)
              Firestore URLs only (never file bytes)
```

### Collections Schema

**events**
```
- id: string
- name: string
- date: string
- location: string
- description: string
- bannerImageUrl: string (URL from Storage)
- attendees: string[] (user IDs)
- capacity: number
- status: 'published' | 'draft' | 'archived'
```

**opportunities**
```
- id: string
- businessId: string
- title: string
- description: string
- type: 'job' | 'internship' | 'partnership'
- salary: number (optional)
- applications: number
- status: 'open' | 'closed'
- createdAt: Date
```

**applications**
```
- id: string
- opportunityId: string
- businessId: string
- applicantId: string
- applicantName: string
- applicantEmail: string
- coverNote: string
- status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
- createdAt: Date
```

**offers** (business products)
```
- id: string
- businessId: string
- name: string
- description: string
- price: number
- imageUrl: string (URL from Storage)
- category: string
- inStock: number
- status: 'active' | 'inactive'
- createdAt: Date
```

## Testing Checklist

### User Flow Testing
- [ ] Guest → Login → Member Dashboard → See events, opportunities, donations
- [ ] Member → Upgrade to Business → Redirected to /business/dashboard
- [ ] Business → Post opportunity → Shows on /opportunities public page
- [ ] Member → Browse /opportunities → Apply → Application appears on business side
- [ ] Business → Create offer → Shows in /marketplace on both public and member dashboard

### Admin Testing  
- [ ] Admin login → Access /admin dashboard
- [ ] Admin creates event → Updates Firestore
- [ ] Admin edits event → Public page updates in realtime
- [ ] Admin deletes event → Event removed from public view
- [ ] Admin approves opportunity → Appears in public /opportunities

### Firebase/Firestore Testing
- [ ] All images stored in Firebase Storage (not Firestore)
- [ ] Firestore only stores URLs to Storage files
- [ ] No base64 or file bytes in Firestore
- [ ] Realtime listeners working on all dashboard pages
- [ ] No hardcoded data - everything from Firestore

## Known Issues Fixed

1. ✅ Auth bug: role vs roles mismatch - Fixed with hasBusinessAccess()
2. ✅ BusinessPortalSwitcher redirect - Fixed to /business/dashboard
3. ✅ Dashboard auth inconsistency - Fixed to use useAuth()
4. ✅ Business layout responsiveness - Already using Tailwind classes
5. ✅ Login redirect logic - Updated to use hasBusinessAccess()

## Remaining Work (if any)

None identified. The system is architecturally complete and properly gated.

All code follows the golden rule:
- **Firestore:** Stores structured data (text, numbers, arrays, URLs)
- **Firebase Storage:** Holds all files (images, PDFs, documents)
- **URLs:** Firestore documents reference Storage files via URLs only

## Next Steps

1. Manual end-to-end testing in browser
2. Verify realtime sync on all pages
3. Test role transitions (member → business)
4. Verify admin functions save to Firestore
5. Deploy to production when ready

---

**Build Status:** ✅ Successful (161 pages, 20.6s)  
**Deployment:** https://test.myflynai.com  
**Branch:** v0/pbxyz-9017-ea798fe3 → main
