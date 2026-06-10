# Activity Logging System - Complete Reference Guide

## Overview

Every action users take during signup and signin is recorded in the Firestore `activities` collection with complete context including timestamps, IP addresses, user agents, and custom metadata.

---

## Activity Recording Architecture

### Components

1. **Activity Logger** (`lib/activity-logger.ts`)
   - Centralized logging utility
   - Fetches client IP via `/api/get-ip`
   - Records user agent from browser
   - Sends activities to Firestore

2. **Firestore Collection** (`activities`)
   - Auto-timestamps with server time
   - Indexed for efficient querying
   - Retention policy ready (configure via Firestore)

3. **Integration Points**
   - Signup page (`app/signup/signup-client.tsx`)
   - Login page (`app/login/login-client.tsx`)
   - Forms, buttons, inputs

---

## Signup Flow Activity Log

### 1. Page Visit
**Event Type:** `SIGNUP_PAGE_VISIT`
**When:** User navigates to `/signup`
**Firestore Record:**
```javascript
{
  userId: "guest",
  userEmail: "guest@passiveblessings.com",
  activityType: "SIGNUP_PAGE_VISIT",
  action: "Visited signup page",
  timestamp: 2026-06-10T14:32:00.000Z,
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  metadata: {
    timestamp: "2026-06-10T14:32:00.000Z",
    step: 1
  }
}
```

### 2. Step Navigation
**Event Type:** `SIGNUP_STEP`
**When:** User clicks "Next" or "Back" button
**Firestore Record:**
```javascript
{
  userId: "guest",
  userEmail: "guest@passiveblessings.com",
  activityType: "SIGNUP_STEP",
  action: "Moved to step 2",
  timestamp: 2026-06-10T14:32:15.000Z,
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  metadata: {
    previousStep: 1,
    currentStep: 2,
    formDataFields: 23,
    timestamp: "2026-06-10T14:32:15.000Z"
  }
}
```

### 3. Validation Error
**Event Type:** `OTHER`
**When:** User submits form with missing/invalid data
**Firestore Record (Missing Fields Example):**
```javascript
{
  userId: "guest",
  userEmail: "test@example.com",
  activityType: "OTHER",
  action: "Validation error - missing required fields",
  timestamp: 2026-06-10T14:32:45.000Z,
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  metadata: {
    error: "Please fill in all required fields",
    fields: {
      firstName: false,
      lastName: true,
      email: true
    }
  }
}
```

**Firestore Record (Password Mismatch Example):**
```javascript
{
  userId: "guest",
  userEmail: "test@example.com",
  activityType: "OTHER",
  action: "Validation error - passwords mismatch",
  timestamp: 2026-06-10T14:32:50.000Z,
  metadata: {
    error: "Passwords do not match"
  }
}
```

### 4. Signup Start
**Event Type:** `SIGNUP_START`
**When:** User clicks "Create Account" button with valid form
**Firestore Record:**
```javascript
{
  userId: "guest",
  userEmail: "newuser@example.com",
  activityType: "SIGNUP_START",
  action: "Starting signup process",
  timestamp: 2026-06-10T14:33:00.000Z,
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  metadata: {
    memberType: "general",
    timestamp: "2026-06-10T14:33:00.000Z"
  }
}
```

### 5. Signup Success
**Event Type:** `SIGNUP_COMPLETE`
**When:** User account successfully created in Firebase and Firestore
**Firestore Record:**
```javascript
{
  userId: "ORHnNNkW9CNpGoiXIzhBia0gtH92",  // Firebase Auth UID
  userEmail: "newuser@example.com",
  activityType: "SIGNUP_COMPLETE",
  action: "Successfully created account",
  timestamp: 2026-06-10T14:33:05.000Z,
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  metadata: {
    userId: "ORHnNNkW9CNpGoiXIzhBia0gtH92",
    memberType: "general",
    location: "Dubai",
    hasVolunteerAvailability: true,
    totalFormFields: 50,
    timestamp: "2026-06-10T14:33:05.000Z"
  }
}
```

### 6. Signup Failure
**Event Type:** `OTHER`
**When:** Signup fails (duplicate email, network error, etc.)
**Firestore Record:**
```javascript
{
  userId: "guest",
  userEmail: "duplicate@example.com",
  activityType: "OTHER",
  action: "Signup failed",
  timestamp: 2026-06-10T14:33:10.000Z,
  ipAddress: "192.168.1.100",
  metadata: {
    error: "Firebase: Error (auth/email-already-in-use).",
    errorCode: "auth/email-already-in-use",
    timestamp: "2026-06-10T14:33:10.000Z"
  }
}
```

---

## Login Flow Activity Log

### 1. Page Visit
**Event Type:** `LOGIN_PAGE_VISIT`
**When:** User navigates to `/login`
**Firestore Record:**
```javascript
{
  userId: "guest",
  userEmail: "guest@passiveblessings.com",
  activityType: "LOGIN_PAGE_VISIT",
  action: "Visited login page",
  timestamp: 2026-06-10T14:35:00.000Z,
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  metadata: {
    timestamp: "2026-06-10T14:35:00.000Z"
  }
}
```

### 2. Admin Access Code Verification
**Event Type:** `OTHER`
**When:** Admin enters access code for admin panel
**Firestore Record (Valid):**
```javascript
{
  userId: "guest",
  userEmail: "guest@passiveblessings.com",
  activityType: "OTHER",
  action: "Admin access code verified successfully",
  timestamp: 2026-06-10T14:35:10.000Z,
  metadata: {
    timestamp: "2026-06-10T14:35:10.000Z"
  }
}
```

**Firestore Record (Invalid):**
```javascript
{
  userId: "guest",
  userEmail: "guest@passiveblessings.com",
  activityType: "OTHER",
  action: "Admin access code verification failed",
  timestamp: 2026-06-10T14:35:12.000Z,
  metadata: {
    error: "Invalid access code",
    timestamp: "2026-06-10T14:35:12.000Z"
  }
}
```

### 3. Signin Attempt (Regular User)
**Event Type:** `OTHER`
**When:** User enters email and password
**Firestore Record:**
```javascript
{
  userId: "guest",
  userEmail: "existinguser@example.com",
  activityType: "OTHER",
  action: "Attempting sign in",
  timestamp: 2026-06-10T14:35:20.000Z,
  metadata: {
    loginType: "regular",
    timestamp: "2026-06-10T14:35:20.000Z"
  }
}
```

### 4. Signin Failure
**Event Type:** `SIGNIN_FAILED`
**When:** Invalid email or password
**Firestore Record:**
```javascript
{
  userId: "guest",
  userEmail: "user@example.com",
  activityType: "SIGNIN_FAILED",
  action: "Sign in failed",
  timestamp: 2026-06-10T14:35:25.000Z,
  ipAddress: "192.168.1.100",
  metadata: {
    error: "Firebase: Error (auth/user-not-found).",
    reason: "Authentication error",
    timestamp: "2026-06-10T14:35:25.000Z"
  }
}
```

### 5. Signin Success
**Event Type:** `SIGNIN`
**When:** User successfully authenticates
**Firestore Record (Regular User):**
```javascript
{
  userId: "ORHnNNkW9CNpGoiXIzhBia0gtH92",
  userEmail: "user@example.com",
  activityType: "SIGNIN",
  action: "Successfully signed in",
  timestamp: 2026-06-10T14:35:30.000Z,
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0...",
  metadata: {
    userId: "ORHnNNkW9CNpGoiXIzhBia0gtH92",
    userRole: "member",
    rememberMe: true,
    timestamp: "2026-06-10T14:35:30.000Z"
  }
}
```

**Firestore Record (Admin User):**
```javascript
{
  userId: "AdminUID123456",
  userEmail: "admin@example.com",
  activityType: "SIGNIN",
  action: "Successfully signed in as admin",
  timestamp: 2026-06-10T14:35:35.000Z,
  ipAddress: "192.168.1.100",
  metadata: {
    userId: "AdminUID123456",
    userRole: "admin",
    timestamp: "2026-06-10T14:35:35.000Z"
  }
}
```

---

## Firestore Query Examples

### Get All Activities for a User
```javascript
db.collection('activities')
  .where('userId', '==', 'ORHnNNkW9CNpGoiXIzhBia0gtH92')
  .orderBy('timestamp', 'desc')
  .limit(50)
  .get()
```

### Get All Signup Activities
```javascript
db.collection('activities')
  .where('activityType', '==', 'SIGNUP_COMPLETE')
  .orderBy('timestamp', 'desc')
  .limit(100)
  .get()
```

### Get Failed Signin Attempts
```javascript
db.collection('activities')
  .where('activityType', '==', 'SIGNIN_FAILED')
  .orderBy('timestamp', 'desc')
  .limit(50)
  .get()
```

### Get Activities by IP Address (Fraud Detection)
```javascript
db.collection('activities')
  .where('ipAddress', '==', '192.168.1.100')
  .orderBy('timestamp', 'desc')
  .limit(100)
  .get()
```

### Get Failed Validations
```javascript
db.collection('activities')
  .where('activityType', '==', 'OTHER')
  .where('action', '>=', 'Validation error')
  .orderBy('timestamp', 'desc')
  .limit(50)
  .get()
```

---

## Activity Record Structure

Every activity document has this structure:

```javascript
{
  // Core Information
  userId: string,           // Firebase UID or "guest"
  userEmail: string,        // User's email address
  activityType: string,     // Type: SIGNUP_PAGE_VISIT, SIGNUP_STEP, SIGNUP_START, SIGNUP_COMPLETE, LOGIN_PAGE_VISIT, SIGNIN, SIGNIN_FAILED, OTHER
  action: string,           // Human-readable action description
  
  // Timing & Location
  timestamp: Timestamp,     // Server-set timestamp (UTC)
  ipAddress: string,        // Client IP address
  userAgent: string,        // Browser/device info
  
  // Context
  metadata: {
    // Various fields depending on activity type
    // Examples:
    // - previousStep, currentStep for SIGNUP_STEP
    // - error, errorCode for failures
    // - userId, memberType, location for signup completion
    // - userRole, rememberMe for signin
  }
}
```

---

## Data Privacy & Retention

### Logged Information
- Email addresses (user identifier)
- IP addresses (for fraud detection)
- User agents (for device tracking)
- Form field names (not values like passwords)
- Error types and codes (for debugging)

### NOT Logged
- Passwords (never logged)
- Credit card data (not captured)
- Sensitive personal data
- Form field values for sensitive fields

### Retention Policy (Recommended)
- Activities older than 90 days: Archive to Cloud Storage
- Activities older than 1 year: Delete permanently
- Configure in Firestore TTL settings

---

## Monitoring & Alerts

### Suggested Alerts
1. **Failed Signups**: Alert if > 10 failures in 1 hour
2. **Failed Signins**: Alert if > 5 failed attempts from same IP
3. **Validation Errors**: Alert if > 50 validation errors in 1 hour
4. **Unusual Activity**: Alert if activity from multiple IPs in same minute

### Dashboard Metrics
- Daily signups: Count `SIGNUP_COMPLETE`
- Daily active users: Count unique `SIGNIN` events
- Validation error rate: Count `OTHER` with "Validation error"
- Successful signin rate: `SIGNIN` / (`SIGNIN` + `SIGNIN_FAILED`)

---

## Integration Points

### Activity Logger Usage

```javascript
import { logActivity } from '@/lib/activity-logger'

// Log an activity
await logActivity(
  userId,           // String or "guest"
  email,            // User email
  activityType,     // "SIGNUP_PAGE_VISIT", "SIGNIN", etc.
  action,           // Human-readable action
  metadata          // Optional custom data object
)
```

### Example from Signup
```javascript
logActivity(
  'guest',
  formData.email,
  'SIGNUP_START',
  'Starting signup process',
  {
    memberType: formData.memberType,
    timestamp: new Date().toISOString()
  }
)
```

### Example from Login
```javascript
logActivity(
  user.id,
  user.email,
  'SIGNIN',
  'Successfully signed in',
  {
    userId: user.id,
    userRole: user.role,
    timestamp: new Date().toISOString()
  }
)
```

---

## Debugging & Troubleshooting

### Activities Not Appearing

1. **Check Firestore Permissions**
   ```
   // Rule should allow activity writes
   match /activities/{document=**} {
     allow read: if request.auth != null;
     allow create: if true; // Allow guest activities
   }
   ```

2. **Check Browser Console**
   - Look for `[v0]` debug messages
   - Check for CORS errors on `/api/get-ip`

3. **Verify Firestore Connection**
   - Check env vars: `NEXT_PUBLIC_FIREBASE_*`
   - Test via Firebase Console

### IP Address Not Capturing

1. Check `/api/get-ip` responds correctly
2. Verify not behind proxy (may need `x-forwarded-for` header)
3. Check Firestore rules allow write

### Metadata Not Recording

1. Ensure metadata object is JSON serializable
2. Don't include Date objects directly (convert to ISO string)
3. Keep metadata under 100KB per record

---

## Performance Considerations

- Activity logging is **async** (doesn't block form submission)
- IP detection API cached client-side for 5 minutes
- Firestore writes use automatic indexing
- Consider batch writes for high-volume scenarios
- Archive old activities to reduce query cost

---

## Security Notes

- Activity logs contain email addresses (PII) - handle with care
- IP addresses may be logged for fraud detection
- User agents logged for device tracking
- Implement proper Firestore RLS for production
- Consider encrypting sensitive metadata fields
- Regular audit of activity logs recommended

---

## Next Steps

1. Test signup flow and verify all activities logged
2. Test signin flow and verify session tracking
3. Set up monitoring dashboard
4. Configure retention policies
5. Implement admin dashboard for activity review
6. Set up alerts for anomalies
