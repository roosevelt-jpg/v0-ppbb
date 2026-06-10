# Testing Guide - Passive Blessings Platform

Complete testing procedures for all major features.

## Prerequisites

1. Local development environment running: `pnpm dev`
2. Firebase project configured with `.env.local`
3. Stripe and SendGrid API keys (optional for initial testing)

## Test Scenarios

### Test 1: Complete User Signup Flow

**Objective**: Verify signup form saves data to Firestore with all brand styling

**Steps**:
1. Open http://localhost:3000/signup
2. Verify:
   - [ ] Logo visible in navbar (brand-compliant sizing)
   - [ ] Navigation links visible (About us, Join, Events, etc.)
   - [ ] Progress bar on left sidebar shows 0%
   - [ ] Background color is #f7f6f2 (Warm White)
   - [ ] Font matches DM Sans

**Step 1: User Type Selection**
1. Click "General member" button
   - [ ] Button has Ink Black background with Warm White text
   - [ ] Border changes to Ink Black (2px)
2. Click "Continue"
   - [ ] Progress bar shows 25%
   - [ ] Step indicator on sidebar updates

**Step 2: Personal Information**
1. Fill in form with:
   - First name: "John"
   - Last name: "Doe"
   - Email: "john@example.com"
   - Password: "Test12345!"
   - Confirm password: "Test12345!"
   - DOB: "1990-01-15"
   - Gender: "Male"
   - Nationality: "UAE National"
   - Occupation: "Software Engineer"
   - Employer: "Tech Corp"

2. Upload profile image:
   - [ ] Click drag-drop area or "Click to upload"
   - [ ] Select JPG/PNG file
   - [ ] Image preview appears
   - [ ] File name displays
   - [ ] Can click "Remove" to delete

3. Verify styling:
   - [ ] All input fields have 36px height
   - [ ] Borders are #e4e1da (Sand Border)
   - [ ] Labels are uppercase with letter spacing
   - [ ] Text color is #333333 (Charcoal)

4. Click "Continue"
   - [ ] Progress bar shows 50%

**Step 3: Location**
1. Click "Detect my location"
   - [ ] Browser asks for location permission
   - [ ] Button changes to "Detecting location..."
   - [ ] After ~2 seconds, location card appears
   - [ ] Shows address, city, country

2. Verify location card:
   - [ ] Background is #f7f6f2
   - [ ] "Why we ask for your location" section visible
   - [ ] Can click "Change location" to retry

3. Click "Continue"
   - [ ] Progress bar shows 75%

**Step 4: Consent & Agreement**
1. Verify all checkboxes visible:
   - [ ] Terms & Conditions (with blue link)
   - [ ] UAE Data Protection Policy (with blue link)
   - [ ] Location consent confirmation
   - [ ] Newsletter subscription (optional)

2. Check first two mandatory checkboxes
   - [ ] Button enables after checking both

3. Click "Create account & continue"
   - [ ] Loading state shows "Creating account..."
   - [ ] After ~2 seconds, redirects to /dashboard

**Firestore Verification**:
1. Open Firebase Console → Firestore
2. Check `users` collection:
   - [ ] New document created with Firebase uid
   - [ ] Document contains all form data
   - [ ] profileImage has base64 data
   - [ ] location has latitude, longitude, address
   - [ ] createdAt timestamp present

### Test 2: Admin Settings Configuration

**Objective**: Verify admin can configure site branding and API keys

**Steps**:
1. Sign up with admin account (from Test 1)
2. Navigate to http://localhost:3000/admin/settings

**Site Branding Section**:
1. Verify page loads:
   - [ ] "Site Branding" card visible
   - [ ] All form fields present
   - [ ] Default values shown

2. Upload logo (light):
   - [ ] Click upload area
   - [ ] Select PNG/JPG file
   - [ ] Image preview shows
   - [ ] Can remove image

3. Update form fields:
   - Site Name: "Test Organization"
   - Description: "This is a test organization"
   - Primary Color: Change to #FF0000 (red)

4. Click "Save Site Settings"
   - [ ] Success message appears (green)
   - [ ] Message disappears after 3 seconds

**Firestore Verification**:
1. Open Firebase Console → Firestore
2. Check `siteSettings` collection:
   - [ ] `default` document exists
   - [ ] siteName updated to "Test Organization"
   - [ ] logoUrl contains base64 image data
   - [ ] primaryColor is #FF0000
   - [ ] updatedAt timestamp recent

**API Configuration Section**:
1. Scroll to "API Integrations"
2. Verify sections present:
   - [ ] Stripe Integration
   - [ ] SendGrid Integration

3. Test Stripe (skip if no key):
   - [ ] Paste test Stripe key
   - [ ] Check "Active" checkbox
   - [ ] Click "Save Stripe Config"
   - [ ] Success message appears

4. Check Firestore `apiConfigs` collection:
   - [ ] `stripe` document has apiKey (encrypted)
   - [ ] status is "active"

### Test 3: Homepage with Live Data

**Objective**: Verify homepage pulls settings from Firestore

**Steps**:
1. Navigate to http://localhost:3000
2. Verify homepage displays:
   - [ ] Logo from admin settings
   - [ ] Site title matches admin settings
   - [ ] Colors are #111111 (primary), #f7f6f2 (secondary)
   - [ ] Navigation with correct links
   - [ ] Stats section with member count, events, donations
   - [ ] "Get started" button has correct styling

3. Click "Get started"
   - [ ] Navigates to /signup

### Test 4: Login Flow

**Objective**: Verify user authentication

**Steps**:
1. Navigate to http://localhost:3000/login
2. Enter test account credentials:
   - Email: from Test 1
   - Password: from Test 1

3. Click "Sign in"
   - [ ] Loading state shows
   - [ ] Redirects to /dashboard
   - [ ] User information displays

4. Check authenticated state:
   - [ ] Profile picture from signup shows
   - [ ] User name displays
   - [ ] Can access protected routes

### Test 5: Member Dashboard

**Objective**: Verify dashboard loads live data

**Steps**:
1. Login with test account from Test 1
2. Verify dashboard shows:
   - [ ] User greeting with name
   - [ ] Statistics cards (events, donations, etc.)
   - [ ] Navigation menu working
   - [ ] Dark mode toggle functional

3. Check live data:
   - [ ] Click Events tab
   - [ ] Click Donations tab
   - [ ] Data loads from Firestore

### Test 6: Multilingual Support

**Objective**: Verify language switching works

**Steps**:
1. Navigate to http://localhost:3000/signup
2. Look for language switcher (top right area)
3. Click language selector
4. Choose "العربية" (Arabic)
   - [ ] Page text changes to Arabic
   - [ ] Layout flips to RTL
   - [ ] Form elements properly positioned

5. Choose "Español" (Spanish)
   - [ ] Page text changes to Spanish
   - [ ] Layout is LTR

6. Verify form still works in different languages
   - [ ] Validation messages appear in chosen language
   - [ ] Navigation translates correctly

### Test 7: Dark Mode

**Objective**: Verify dark theme support

**Steps**:
1. Navigate to any page
2. Look for theme toggle (usually in header or sidebar)
3. Click to enable dark mode:
   - [ ] Background changes to dark
   - [ ] Text changes to light
   - [ ] Logo switches to dark version
   - [ ] All colors invert appropriately

4. Verify brand colors in dark mode:
   - [ ] Ink Black becomes light foreground
   - [ ] Warm White becomes dark background
   - [ ] All text remains readable

### Test 8: Image Upload & Persistence

**Objective**: Verify images store correctly

**Steps**:
1. Complete signup with image (from Test 1)
2. Login to admin dashboard
3. Check Firestore for user document:
   - [ ] profileImage.base64 contains encoded image
   - [ ] profileImage.mimeType is "image/jpeg" or similar
   - [ ] profileImage.fileName matches uploaded file

4. Go to dashboard and verify:
   - [ ] Profile picture displays correctly
   - [ ] Image quality preserved

### Test 9: Geolocation Accuracy

**Objective**: Verify location detection works

**Steps**:
1. Start signup
2. Go to Step 3 (Location)
3. Click "Detect my location"
4. When permission popup appears:
   - [ ] Allow location access
   - [ ] System detects current position

5. Verify Firestore stores:
   - [ ] latitude (number)
   - [ ] longitude (number)
   - [ ] address (string with full address)
   - [ ] city (string)
   - [ ] country (string)

### Test 10: Form Validation

**Objective**: Verify form validates correctly

**Steps**:
1. Go to signup
2. Try submitting without entering data:
   - [ ] Red error messages appear
   - [ ] Required fields indicated with *
   - [ ] Cannot continue to next step

3. Enter invalid email:
   - [ ] "Invalid email" error shows

4. Enter mismatched passwords:
   - [ ] "Passwords don't match" error shows

5. Try uploading wrong file type:
   - [ ] "Please upload an image file" error shows

6. Try uploading file > 5MB:
   - [ ] "Image must be less than 5MB" error shows

### Test 11: Admin Sidebar Navigation

**Objective**: Verify admin navigation works

**Steps**:
1. Go to /admin/settings (logged in as admin)
2. Verify sidebar visible:
   - [ ] Logo with ESTD 2025
   - [ ] Menu items: Overview, Members, Events, Businesses, Pages, Settings, Health

3. Click each menu item:
   - [ ] Corresponding page loads
   - [ ] URL updates correctly
   - [ ] Active item highlighted

4. Test theme toggle in sidebar:
   - [ ] Works correctly
   - [ ] Admin panel respects theme

### Test 12: Responsive Design

**Objective**: Verify mobile responsiveness

**Steps**:
1. Open http://localhost:3000/signup
2. Open DevTools (F12)
3. Switch to device emulation:
   - [ ] Select iPhone 12
   - [ ] Layout adapts properly
   - [ ] Form still functional on mobile
   - [ ] Navigation collapses (if applicable)

4. Test tablet view:
   - [ ] iPhone Pro or iPad
   - [ ] Grid layouts adjust

5. Test desktop (1920px):
   - [ ] Multi-column layouts display

### Test 13: Performance

**Objective**: Verify page loads efficiently

**Steps**:
1. Open DevTools → Network tab
2. Go to http://localhost:3000/signup
3. Check metrics:
   - [ ] Total load < 3 seconds
   - [ ] No 404 errors
   - [ ] All images load

4. Go to /admin/settings:
   - [ ] Page loads < 2 seconds
   - [ ] Settings load from Firestore

## Error Scenarios

### Test E1: Firebase Offline

**Steps**:
1. Disconnect internet
2. Try to go to /dashboard
   - [ ] Appropriate error message shows
   - [ ] App doesn't crash

### Test E2: Invalid API Key

**Steps**:
1. Enter invalid Stripe key in admin settings
2. Go to /admin/health
   - [ ] Stripe shows "Down"
   - [ ] Error message explains issue

### Test E3: Database Error

**Steps**:
1. Delete user document while logged in
2. Try to access profile
   - [ ] Graceful error handling
   - [ ] Redirect to login

## Success Criteria

All tests should pass with:
- ✅ No console errors (except expected warnings)
- ✅ All UI elements render correctly with brand colors
- ✅ Data persists in Firestore
- ✅ No dead links or broken navigation
- ✅ Proper error messages for invalid actions
- ✅ Responsive on mobile, tablet, desktop
- ✅ Dark mode works consistently
- ✅ All languages work correctly

## Test Data

Use this data for consistent testing:

```
Email: test@passiveblessings.ae
Password: TestPass123!
First Name: Test
Last Name: User
DOB: 1990-01-01
Gender: Male
Nationality: UAE National
Occupation: Developer
```

## Bug Report Template

If you find an issue:

```
**Title**: [Brief description]

**Environment**: 
- Browser: [Chrome/Firefox/Safari]
- Device: [Desktop/Mobile]
- URL: [Full URL]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happens]

**Screenshots**: [If applicable]

**Console Errors**: [Copy from DevTools]
```

---

**Last Updated**: June 2025
**Platform Version**: 1.0
