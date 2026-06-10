# Complete End-to-End Testing Checklist
# Passive Blessings - Signup/Signin/Activity Logging

## Pre-Test Setup
- [ ] Deploy latest changes to production
- [ ] Verify Firebase project is configured
- [ ] Check Firestore database is accessible
- [ ] Open Firefox/Chrome DevTools for console monitoring
- [ ] Have Firebase Console open for verification
- [ ] Test email provider (Gmail, Outlook, etc.)

---

## TEST SUITE 1: SIGNUP FORM - STEP 1 (Personal Information)

### Navigation & Layout
- [ ] Page loads without errors
- [ ] Logo visible and clickable
- [ ] Progress indicator shows Step 1 of 3
- [ ] Form fields properly aligned
- [ ] "Back" button disabled (not first step)
- [ ] "Next" button visible

### Email Field
- [ ] Text input accepts email format
- [ ] Validation shows error for invalid email
- [ ] Placeholder text shows example
- [ ] Value persists on navigation back

### Password Fields
- [ ] Password field masks input
- [ ] Confirm password field masks input
- [ ] Length validation (minimum 6 characters)
- [ ] Mismatch validation shows error
- [ ] Visual feedback on strong/weak password

### Name Fields
- [ ] First name field required
- [ ] Last name field required
- [ ] Special characters allowed
- [ ] Max length respected

### Member Type
- [ ] Dropdown shows 3 options (General/Volunteer/Member-Volunteer)
- [ ] Selection updates form metadata
- [ ] Default selection shown

### "Next" Button Click
- [ ] Form validates before proceeding
- [ ] On valid form: activity logged to Firestore
  - Query: `activities` collection
  - Check: `activityType === "SIGNUP_STEP"`
  - Check: `metadata.previousStep === 1`
  - Check: `metadata.currentStep === 2`
- [ ] Transitions to Step 2
- [ ] Form data preserved

### Error Handling - Step 1
- [ ] Missing email: Shows "Email required"
  - [ ] Activity logged with validation error
- [ ] Invalid email: Shows "Invalid email format"
  - [ ] Activity logged with error details
- [ ] Missing password: Shows "Password required"
- [ ] Password < 6 chars: Shows "Password must be 6+ characters"
  - [ ] Activity logged with password length
- [ ] Passwords don't match: Shows "Passwords do not match"
  - [ ] Activity logged

---

## TEST SUITE 2: SIGNUP FORM - STEP 2 (Location & Details)

### Navigation
- [ ] Page shows Step 2 of 3
- [ ] Back button now enabled
- [ ] Back button click logs `SIGNUP_STEP` activity
  - [ ] `metadata.previousStep === 2`
  - [ ] `metadata.currentStep === 1`

### Location Fields
- [ ] Country field auto-fills to "UAE"
- [ ] Emirate dropdown shows options
- [ ] City field accepts text
- [ ] Area field accepts text

### Volunteer Section (if applicable)
- [ ] Volunteer days checkboxes visible
- [ ] Multiple selections allowed
- [ ] Selections persist
- [ ] Hours per month field accepts numbers

### Referral Section
- [ ] Referral source dropdown has options
- [ ] Member name field shows when code selected

### Next Button
- [ ] Validation passes with populated fields
- [ ] Activity logged: `SIGNUP_STEP` (2 → 3)
  - [ ] Check: `metadata.currentStep === 3`

---

## TEST SUITE 3: SIGNUP FORM - STEP 3 (Consents & Submit)

### Navigation
- [ ] Page shows Step 3 of 3
- [ ] Back button logs step change correctly

### Consent Checkboxes
- [ ] Terms & Conditions checkbox visible
  - [ ] Clicking checkbox toggles state
  - [ ] Links to `/policies/terms-of-service` work
- [ ] Privacy Policy checkbox visible
  - [ ] Links to `/policies/privacy-policy` work
- [ ] Location consent checkbox optional
- [ ] Notification consent checkbox optional

### Form Submission Button
- [ ] Button shows "Create Account"
- [ ] Button disabled until consents checked

### Form Validation Before Submit
- [ ] Missing email: Shows "Email required"
- [ ] Missing password: Shows "Password required"
- [ ] Missing first/last name: Shows "Name required"
- [ ] Terms not checked: Shows "Accept terms"
- [ ] Privacy not checked: Shows "Accept privacy"
- [ ] Error logs activity: `activityType === "OTHER"`
  - [ ] Check: `action` contains "Validation error"
  - [ ] Check: `metadata.error` populated

### Successful Signup
**Precondition:** Fill ALL required fields with valid data

1. Click "Create Account"
2. Verify activities logged in Firestore:
   - [ ] `SIGNUP_START` logged
     - Check: `metadata.memberType` set
     - Check: `metadata.timestamp` = current time
   
   - [ ] `SIGNUP_COMPLETE` logged (after user created)
     - Check: `userId` is Firebase UID (not "guest")
     - Check: `metadata.userId` matches
     - Check: `metadata.hasVolunteerAvailability` if applicable

3. Verify redirect to dashboard
   - [ ] URL changes to `/dashboard`
   - [ ] Dashboard loads without errors

4. Verify user document in Firestore:
   - Go to Firebase Console → Firestore
   - Collection: `users` → Document ID = test user's UID
   - [ ] All fields populated:
     - email ✓
     - firstName ✓
     - lastName ✓
     - role (member/volunteer/business) ✓
     - active: true ✓
     - createdAt: [timestamp] ✓
     - updatedAt: [timestamp] ✓
     - consentTerms: true ✓
     - consentPrivacy: true ✓

5. Verify activities for new user:
   - Query: `activities` collection
   - Filter: `userId === "[new user UID]"`
   - [ ] Should contain:
     - SIGNUP_PAGE_VISIT (initial)
     - SIGNUP_STEP (1→2)
     - SIGNUP_STEP (2→3)
     - SIGNUP_START
     - SIGNUP_COMPLETE

---

## TEST SUITE 4: SIGNUP ERROR SCENARIOS

### Test Case 1: Duplicate Email
1. Create account with: `test-user-1@passiveblessings.com`
2. Try to signup again with same email
3. Expected: Firebase error "Email already in use"
   - [ ] Activity logged: `activityType === "OTHER"`
   - [ ] Check: `action === "Signup failed"`
   - [ ] Check: `metadata.errorCode === "auth/email-already-in-use"`

### Test Case 2: Network Error
1. In DevTools Network tab, throttle to "Offline"
2. Try to signup
3. Expected: Error message shown
   - [ ] Activity logged with error details
4. Restore network

### Test Case 3: Missing Consent
1. Fill all fields but uncheck Terms checkbox
2. Try to submit
3. Expected: Validation error shown
   - [ ] Activity logged: `activityType === "OTHER"`
   - [ ] Check: `metadata.error` contains "consent"

---

## TEST SUITE 5: LOGIN FLOW

### Page Load
1. Navigate to `/login`
2. Verify activities logged:
   - [ ] `LOGIN_PAGE_VISIT` logged
   - Check: `userId === "guest"`
   - Check: `userEmail === "guest@passiveblessings.com"`

### Layout
- [ ] Logo visible
- [ ] Login form displayed
- [ ] Email and password fields visible
- [ ] "Sign In" button visible
- [ ] Community stats displayed on right side

### Regular User Signin
1. Enter email: `[test-user-1@passiveblessings.com]`
2. Enter password: `[test-user-1-password]`
3. Click "Sign In"

**Verify:**
- [ ] Activity logged: `activityType === "OTHER"`
  - Check: `action === "Attempting sign in"`
  - Check: `metadata.loginType === "regular"`

- [ ] After successful auth, activity logged: `activityType === "SIGNIN"`
  - Check: `userId === "[user UID]"` (not "guest")
  - Check: `metadata.userRole === "member"` (or appropriate role)
  - Check: `ipAddress` populated
  - Check: `timestamp` current

- [ ] Redirected to `/dashboard`

### Failed Signin (Wrong Password)
1. Enter email: `[valid-user@email.com]`
2. Enter password: `[incorrect-password]`
3. Click "Sign In"

**Verify:**
- [ ] Activity logged: `activityType === "SIGNIN_FAILED"`
  - Check: `action === "Sign in failed"`
  - Check: `metadata.error` contains error message
  - Check: `metadata.reason === "Authentication error"`

- [ ] Error message shown to user

### Failed Signin (Non-existent User)
1. Enter email: `[never-registered@email.com]`
2. Enter password: `[any-password]`
3. Click "Sign In"

**Verify:**
- [ ] Activity logged: `activityType === "SIGNIN_FAILED"`
- [ ] Error shown: "User not found" or similar

---

## TEST SUITE 6: ACTIVITY LOGGING VERIFICATION

### Check Firestore Activities Collection
```
Path: activities
Query: orderBy('timestamp', 'desc')
Limit: 100
```

**Verify Document Structure:**
```
{
  userId: string (UID or "guest")
  userEmail: string
  activityType: string
  action: string
  timestamp: Timestamp
  ipAddress: string
  userAgent: string (browser info)
  metadata: object
}
```

### Count Activities by Type
Execute these queries in Firebase Console:

1. **Total Signups Completed**
   ```
   activities
   .where('activityType', '==', 'SIGNUP_COMPLETE')
   .count()
   ```
   - [ ] Count matches expected signups

2. **Total Signin Attempts**
   ```
   activities
   .where('activityType', '==', 'SIGNIN')
   .count()
   ```

3. **Failed Signins**
   ```
   activities
   .where('activityType', '==', 'SIGNIN_FAILED')
   .count()
   ```

4. **Validation Errors**
   ```
   activities
   .where('activityType', '==', 'OTHER')
   .where('action', '>=', 'Validation error')
   .count()
   ```

### Per-User Activity Audit
1. Pick a test user
2. Query: `activities.where('userId', '==', '[USER_UID]').orderBy('timestamp')`
3. Verify sequence:
   - [ ] SIGNUP_PAGE_VISIT (or LOGIN_PAGE_VISIT)
   - [ ] Form interactions (step changes)
   - [ ] SIGNUP_START
   - [ ] SIGNUP_COMPLETE (or SIGNIN)

---

## TEST SUITE 7: DATA INTEGRITY

### User Document Verification
After signup, go to Firebase Console:
1. Firestore → `users` collection
2. Find document with test user's UID
3. Verify all fields:

**Basic Fields:**
- [ ] id: Matches UID
- [ ] email: Correct email
- [ ] firstName: Filled
- [ ] lastName: Filled

**Status Fields:**
- [ ] role: "member" or "volunteer"
- [ ] active: true
- [ ] emailVerified: false (until email confirmed)
- [ ] profileComplete: true (after signup)

**Timestamps:**
- [ ] createdAt: Timestamp object
- [ ] updatedAt: Timestamp object
- [ ] lastLogin: Timestamp object (if signin)

**Consent Fields:**
- [ ] consentTerms: true
- [ ] consentPrivacy: true
- [ ] consentLocation: true or false (based on selection)

**Membership:**
- [ ] membershipTier: "standard"
- [ ] memberSince: Date signup occurred
- [ ] volunteeredHours: 0 (new user)
- [ ] totalDonated: 0 (new user)

### Location Data Verification
- [ ] country: Saved
- [ ] emirate: Saved
- [ ] city: Saved
- [ ] area: Saved (if filled)

### Professional Data
- [ ] profession: Saved
- [ ] employer: Saved
- [ ] skills: Array populated (if provided)

---

## TEST SUITE 8: PROFILE EDIT & SYNC

### Access Profile Edit
1. After signin, navigate to `/dashboard/profile`
2. Verify page loads with user data

### Edit Profile
1. Change a field (e.g., profession)
2. Click "Save"
3. Verify success message

### Firestore Verification
1. In Firestore, check user document
2. Verify updated field reflects change
3. Check `updatedAt` timestamp is newer

### Admin Member Detail Viewer
1. Navigate to `/admin/members`
2. Find test user in list
3. Click on user
4. Verify all profile data displays correctly

---

## TEST SUITE 9: POLICY PAGES

### Privacy Policy
1. Navigate to `/policies/privacy-policy`
2. [ ] Page loads with content
3. [ ] Title: "Privacy Policy" visible
4. [ ] Last updated date shown
5. [ ] Content displays properly

### Terms of Service
1. Navigate to `/policies/terms-of-service`
2. [ ] Page loads with content
3. [ ] Links work (from signup form)

### Code of Conduct
1. Navigate to `/policies/code-of-conduct`
2. [ ] Page loads with content

---

## TEST SUITE 10: EDGE CASES & SECURITY

### SQL Injection
1. Try email: `admin'--; DROP TABLE users;--`
2. Expected: No effect, form treated as string

### XSS Attempts
1. Try first name: `<script>alert('xss')</script>`
2. Expected: Stored and displayed as-is, no execution

### Very Long Strings
1. Enter 10,000 character password
2. Expected: Either rejected or truncated gracefully

### Special Characters
1. Try special characters in names: `François O'Connor Müller`
2. Expected: Stored and displayed correctly

### Rapid Form Submission
1. Fill form, submit
2. Immediately submit again without waiting
3. Expected: Only one user created, second rejected

---

## FINAL VERIFICATION CHECKLIST

**System Status:**
- [ ] Build passes (0 errors)
- [ ] All pages load without console errors
- [ ] Firebase Auth working
- [ ] Firestore writing successfully
- [ ] Activity logging functional

**User Journey:**
- [ ] Can signup with valid data
- [ ] User document created in Firestore
- [ ] Activities logged for all interactions
- [ ] Can signin with created account
- [ ] Session maintained
- [ ] Can edit profile
- [ ] Admin can view member details

**Data Completeness:**
- [ ] All required fields captured
- [ ] Timestamps accurate
- [ ] IP addresses captured
- [ ] User agents recorded
- [ ] Metadata logged as expected

**Error Handling:**
- [ ] Validation errors shown
- [ ] Failed auths handled gracefully
- [ ] Network errors managed
- [ ] Errors logged to activities

---

## Sign-Off

- **Tested By:** [Your Name]
- **Date Tested:** [Date]
- **Test Environment:** Production / Staging
- **Result:** ✓ PASS / ✗ FAIL
- **Notes:** [Any issues found]

---

## Issues Found & Resolution

| Issue | Severity | Status | Resolution |
|-------|----------|--------|------------|
| Example | Medium | Fixed | Description |

---

## Recommendations

1. [List any recommendations]
2. [Setup monitoring alerts]
3. [Configure retention policies]
4. [Plan email verification]
5. [Set up admin dashboard]

