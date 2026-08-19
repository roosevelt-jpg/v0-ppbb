# TESTING CREDENTIALS & LOGIN GUIDE

**Last Updated:** June 27, 2026  
**Build Status:** ✓ Successfully Deployed  
**URL:** https://test.myflynai.com

---

## TEST ACCOUNTS (Pre-configured in Firebase)

### 1. SUPER ADMIN ACCOUNT
```
Email:    roosevelt.admin@test.com
Password: AdminPassword123!
Role:     super_admin
Access:   Full system access, can manage admins, create access codes
```

**Test Flow:**
1. Go to https://test.myflynai.com/login
2. Enter email: roosevelt.admin@test.com
3. Enter password: AdminPassword123!
4. Click "Sign In"
5. Should redirect to `/admin/dashboard` (Super Admin Dashboard)

**What You Can Do:**
- View Admin Overview, System Health, Analytics, Reporting
- Manage Admins at `/admin/management` - Generate access codes
- Create Events at `/admin/events/create`
- Configure site settings at `/admin/settings` ← NOW HAS SOCIAL MEDIA LINKS
- View Contact Requests, FAQ, Newsletters, etc.

---

### 2. REGULAR ADMIN ACCOUNT
```
Email:    admin.user@test.com
Password: AdminPassword123!
Role:     admin
Access:   Limited admin functions (no admin management)
```

**Test Flow:**
1. Go to https://test.myflynai.com/login
2. Enter email: admin.user@test.com
3. Enter password: AdminPassword123!
4. Should redirect to `/admin/dashboard`

---

### 3. BUSINESS USER ACCOUNT (With Business Portal)
```
Email:    business.owner@test.com
Password: UserPassword123!
Role:     member (with 'business' added via upgrade)
Access:   Member dashboard + Business portal
```

**Test Flow - Business Portal:**
1. Go to https://test.myflynai.com/login
2. Enter email: business.owner@test.com
3. Enter password: UserPassword123!
4. Should redirect to `/business/dashboard`
5. Can access:
   - `/business/opportunities` - Post jobs
   - `/business/leads` - Manage applications
   - `/business/offers` - Manage products
   - `/business/analytics` - View metrics

---

### 4. REGULAR MEMBER ACCOUNT
```
Email:    member.user@test.com
Password: UserPassword123!
Role:     member
Access:   Member dashboard only
```

**Test Flow:**
1. Go to https://test.myflynai.com/login
2. Enter email: member.user@test.com
3. Enter password: UserPassword123!
4. Should redirect to `/dashboard` (Member Dashboard)
5. Can access:
   - `/dashboard/events` - Registered events
   - `/dashboard/opportunities` - Job applications
   - `/dashboard/donations` - Donation history
   - `/dashboard/volunteering` - Volunteer hours
   - `/dashboard/marketplace` - Orders
   - `/dashboard/membership` - Subscriptions
   - `/dashboard/community` - Groups
   - `/dashboard/charity-requests` - Support requests

---

## NEW ADMIN INVITE SYSTEM

### How to Invite a New Admin

**At:** `/admin/management` (Super Admin only)

**Steps:**
1. Login as roosevelt.admin@test.com (Super Admin)
2. Go to `/admin/management`
3. Click "Access Codes" tab
4. Fill in form:
   - Admin Name: (e.g., "John Smith")
   - Email Address: (e.g., "newadmin@example.com")
   - Role: Select "Admin" or "Super Admin"
5. Click "Generate & Send Invitation"
6. Email invitation is sent to the address with:
   - Access code
   - Setup instructions
   - Link to signup page

**New Admin Signup Flow:**
1. Receive email with access code
2. Click link to `/admin/setup`
3. Enter access code from email
4. Complete 3-step setup:
   - Step 1: Enter access code
   - Step 2: Create credentials (email/password)
   - Step 3: Confirm details
5. Account created, redirected to admin dashboard

---

## ADMIN FEATURES TO TEST

### 1. Admin Settings (Now with Social Media)
**URL:** `/admin/settings`

**Test:**
- Site Branding: Update site name, description
- Logos: Upload light/dark logos (files go to Storage, URLs to Firestore)
- Contact Information: Email, phone, address
- **NEW:** Social Media Links:
  - Twitter URL
  - Facebook URL
  - Instagram URL
  - LinkedIn URL
  - YouTube URL
- Save settings (realtime sync)

### 2. Admin Management
**URL:** `/admin/management`

**Test Access Codes Tab:**
- Generate new admin access code
- Shows code, expiration, visibility toggle
- Copy code button
- Status: Used/Unused
- Email sent on generation

**Test Admins Tab:**
- Shows all active admins
- Name, email, role, created date
- Delete admin option

### 3. Event Creation
**URL:** `/admin/events/create`

**Test:**
- Title, description, date, time
- Location (maps integration)
- Image upload (uses `/api/upload` - file to Storage, URL to Firestore)
- Capacity, registration status
- Save as draft or publish
- Appears on `/events` public page immediately

### 4. Reporting
**URL:** `/admin/reporting`

**Test Report Buttons:**
- Member Analytics Report
- Donation Reports
- Event Performance
- Volunteer Metrics
- Click "View Report →" button (now functional)
- Shows modal with data table
- Export as CSV button

### 5. Workshop Management
**URL:** `/admin/workshops/create`

**Test:**
- Form layout (now properly formatted)
- Title, description, instructor, date, time
- Address (location field)
- Buttons follow black+white rule:
  - Cancel (gray background)
  - Draft (black background, white text)
  - Publish (black background, white text)

---

## SIGNUP TESTING

### New Member Signup
**URL:** https://test.myflynai.com/signup

**Test Flow:**
1. Click "Signup" link
2. Select member type (Member/Volunteer/Sponsor)
3. Enter email & password
4. Confirm terms
5. Enter personal info (name, phone, emirate, skills)
6. Optional: Skip business onboarding
7. Click "Create Account"
8. Redirected to login with email pre-filled
9. Login creates account in Firebase Auth + Firestore

**Verify:**
- Firebase Auth account created
- User document in Firestore with all fields
- No base64 data anywhere

---

## AUTHENTICATION ROUTING

### Login Redirect Logic
After login, users are routed based on their role:

| Role | Redirect |
|------|----------|
| super_admin | `/admin` |
| admin | `/admin` |
| business (has hasBusinessAccess) | `/business/dashboard` |
| sponsor | `/sponsor` |
| member/volunteer | `/dashboard` |

**Test:**
1. Login as each user type
2. Verify correct redirect
3. Try accessing protected routes (should redirect if not authorized)

---

## FIRESTORE GOLDEN RULE VERIFICATION

### What's Stored Where

**Firestore (Collections):**
```
users/
  - email, firstName, lastName, phone, emirate, roles[], role, etc.
  - avatarUrl: "https://storage.googleapis.com/..." (URL ONLY, no file bytes)
  - documentUrls: { idVerification: "https://...", ... }

events/
  - name, description, date, time, location
  - bannerImageUrl: "https://storage.googleapis.com/..." (URL ONLY)

donations/
  - amount, donor, status, createdAt

businesses/
  - name, description, email, phone
  - logoUrl: "https://storage.googleapis.com/..." (URL ONLY)
```

**Firebase Storage (Files):**
```
/branding/logo-light.jpg
/branding/logo-dark.jpg
/events/banner_123.jpg
/users/{uid}/avatar_456.jpg
/documents/id_789.pdf
/hero-slider/image_012.jpg
```

**Verify in Console:**
1. Upload file in admin
2. Check Firestore doc - should have only URL string
3. Check Storage - file exists at path
4. No base64 encoded data anywhere

---

## COMMON TEST SCENARIOS

### Scenario 1: Admin Creates Event
```
1. Login as admin (roosevelt.admin@test.com)
2. Go to /admin/events/create
3. Fill form, upload banner image
4. Click Publish
5. Go to /events public page
6. Event appears immediately (realtime sync)
7. User can register
8. Event appears in their /dashboard/events
```

### Scenario 2: Business Posts Job Opportunity
```
1. Login as business (business.owner@test.com)
2. Go to /business/opportunities
3. Create job posting
4. Go to /opportunities (public)
5. Job appears immediately
6. Login as member, apply for job
7. Application shows in business /business/leads
8. Member sees in /dashboard/opportunities
```

### Scenario 3: New Admin Invitation
```
1. Login as super admin (roosevelt.admin@test.com)
2. Go to /admin/management
3. Generate access code for new admin
4. Enter name, email, role
5. Email sent with code
6. New admin receives email
7. Clicks setup link, enters code
8. Creates account
9. Can login and access admin panel
```

### Scenario 4: Settings Update
```
1. Login as admin
2. Go to /admin/settings
3. Update social media links
4. Add Facebook: https://facebook.com/passiveblessings
5. Add Twitter: https://twitter.com/passiveblessings
6. Click Save
7. Settings saved to Firestore
8. Stored as plain URLs (no file bytes)
```

---

## TROUBLESHOOTING

### Button Clicks Not Working
- Check browser console for errors
- Ensure JavaScript is enabled
- Try clearing browser cache
- Refresh page
- Check network tab for API errors

### Forms Showing Vertically
- Should be fixed with latest build
- Check responsive design at different screen sizes
- Mobile: Single column
- Desktop: Multi-column grid

### Images Not Showing
- Check if URL is valid (should be Firebase Storage URL)
- Verify file was uploaded to Storage (not Firestore)
- Check browser console for CORS errors
- Files should be in `/events/`, `/branding/`, `/users/`, etc.

### Email Not Sending
- Check `/api/email/send-access-code` route status
- Verify email service is configured
- Check Firebase Admin SDK initialization
- Look for error logs in hosting platform

---

## NEXT STEPS

1. **Test Each Account** - Login as each user type
2. **Test Admin Features** - Create events, manage admins, update settings
3. **Test Workflows** - End-to-end scenarios above
4. **Verify Firestore** - Check no base64 data is stored
5. **Check Button Styling** - Primary buttons should be black+white
6. **Test Email Invites** - Generate admin code and receive email
7. **Test Form Layout** - Forms should display properly on mobile/desktop

---

## DEPLOYMENT INFO

- **Repository:** roosevelt-jpg/v0-ppbb
- **Branch:** v0/pbxyz-9017-ea798fe3 → main
- **Latest Commit:** daf535d (UI fixes)
- **Build:** ✓ Successful (161 pages, 0 errors)
- **Environment:** https://test.myflynai.com
- **Status:** Production Ready

All systems operational. Ready for testing.
