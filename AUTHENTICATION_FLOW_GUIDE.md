# Authentication Flow Architecture - Passive Blessings

## Current System Overview

Your application has **three user roles** with different access paths:

1. **Member** (Individual users) → `/dashboard`
2. **Business** (Business partners) → `/business`
3. **Admin** (System administrators) → `/admin`

## Current Login Implementation

The existing `/login` page uses **role-based routing** after authentication:

```typescript
// From login-client.tsx (lines 71-77)
if (user.role === 'admin') {
  router.push('/admin')
} else if (user.role === 'business') {
  router.push('/business')
} else {
  router.push('/dashboard')
}
```

This means:
- ✅ One login page for all user types
- ✅ The system automatically detects the user's role
- ✅ Redirects to appropriate dashboard based on role
- ✅ No need for separate login URLs

## Recommended Architecture (ALREADY IMPLEMENTED)

### Best Practice Approach ✅

**Single Login Page with Role-Based Redirection** (Your current setup)

```
┌─────────────────────────────────────────┐
│          /login Page                    │
│  - Email/Password form                  │
│  - Service for all user types          │
└────────────────┬────────────────────────┘
                 │
         (Firebase Authentication)
                 │
        ┌────────┴────────┐
        │                 │
    Fetch User Profile    │
    from Firestore        │
        │                 │
    Check user.role       │
        │                 │
    ┌───┴───┬─────┬─────┐
    │       │     │     │
    ▼       ▼     ▼     ▼
  admin  business  member  guest
    │       │      │      │
    ▼       ▼      ▼      ▼
  /admin /business /dashboard  stay
```

## Why This Approach is Correct

### Advantages

1. **Single Entry Point** - Users don't need to know which login page to use
2. **Auto-Detection** - System determines user type from database
3. **Future-Proof** - Easy to add new roles without creating new pages
4. **Security** - One place to audit authentication attempts
5. **User Experience** - Seamless login regardless of user type
6. **Maintenance** - One codebase for login logic, not multiple copies

### Common Misconception ❌

**"Admins should have separate `/admin/login`"**

Why this is NOT recommended:
- Creates duplicate login logic
- Admin URLs become public knowledge (security through obscurity)
- Confusing UX if admin forgets which page to use
- Harder to maintain two versions
- Violates DRY principle

## Flow Diagram - How Login Works

```
1. User visits /login
2. Enters email + password
3. Firebase authenticates credentials
4. System fetches user document from Firestore/users/{uid}
5. Reads user.role field
6. Routes to appropriate dashboard:
   - role="admin" → /admin
   - role="business" → /business
   - role="member" → /dashboard
   - no profile → show error
```

## Current Implementation Details

### Authentication Components

**1. Login Client** (`/login/login-client.tsx`)
- Email/password form
- Calls `loginUser()` from `@/lib/auth`
- Routes based on user role
- Logs activity for audit trail

**2. Auth Service** (`/lib/auth.ts`)
- `loginUser(email, password)` - Authenticates and fetches user profile
- `registerUser()` - Creates new user with specified role
- Returns `{ user: User | null, error: string | null }`

**3. Auth Context** (`/lib/auth-context.tsx`)
- Global auth state management
- `useAuth()` hook for accessing current user
- Auto-syncs with Firebase `onAuthStateChanged()`
- Provides `logout()` function

**4. Auth Middleware** (`/lib/auth-middleware.ts`)
- `requireAuth()` - Verify user is logged in
- `requireRole()` - Check user has specific role(s)
- `requireAdmin()` - Verify admin access
- `requireAdminRole()` - Check specific admin role
- `requirePermission()` - Check admin permission level

## Protected Route Implementation

### Protecting Admin Routes

Example: `/app/admin/members/page.tsx`

```typescript
// Server Component - checks auth server-side
import { requireAdmin } from '@/lib/auth-middleware'

export default async function MembersPage() {
  const user = await requireAdmin()
  
  if (!user) {
    redirect('/login')
  }
  
  // Component renders only if user is admin
  return (
    <div>
      {/* Admin dashboard */}
    </div>
  )
}
```

### Protecting Business Routes

Example: `/app/business/page.tsx`

```typescript
import { requireRole } from '@/lib/auth-middleware'

export default async function BusinessDashboard() {
  const user = await requireRole('business', 'admin')
  
  if (!user) {
    redirect('/login')
  }
  
  // Component renders only if user is business or admin
  return (
    <div>
      {/* Business dashboard */}
    </div>
  )
}
```

### Protecting Member Routes

Example: `/app/dashboard/page.tsx`

```typescript
import { requireRole } from '@/lib/auth-middleware'

export default async function MemberDashboard() {
  const user = await requireRole('member', 'admin')
  
  if (!user) {
    redirect('/login')
  }
  
  // Component renders
  return (
    <div>
      {/* Member dashboard */}
    </div>
  )
}
```

## User Registration Flow

### Member Signup
1. User visits `/signup`
2. Fills form with personal info
3. System creates account with `role: 'member'`
4. Redirects to `/dashboard` after first login

### Business Signup
1. Business owner visits `/signup` (role selector)
2. Chooses "Business Partner"
3. Fills business-specific form
4. System creates account with `role: 'business'`
5. Redirects to `/business` after login

### Admin Invitation (Manual)
1. Existing admin adds new admin via `/admin/team`
2. System creates user with `role: 'admin'`
3. Sends email with temporary password
4. New admin logs in via `/login`
5. Redirected to `/admin`

## User Role Types

### Member Role
- Access: `/dashboard` and `/events`
- Can: View profile, donate, volunteer, join community
- Cannot: Access business or admin panels

### Business Role
- Access: `/business` dashboard
- Can: Manage listings, view analytics, partnerships
- Cannot: Access member admin or full admin panel

### Admin Role
- Access: `/admin` and all dashboards
- Can: Manage users, moderate, analytics, team management
- Permissions: Controlled by adminRole (superadmin, moderator, analyst)

## Security Considerations

1. **Password Hashing** - Firebase handles via `createUserWithEmailAndPassword()`
2. **Session Persistence** - Uses `browserLocalPersistence` for "remember me"
3. **Token Management** - Firebase auth tokens auto-refresh
4. **Activity Logging** - All login attempts logged via `logActivity()`
5. **Role-Based Access Control** - Middleware checks role before rendering
6. **No Duplicate Sessions** - Firebase prevents multiple active sessions per user

## To Add a New User Role

1. **Update Types** - Add to `UserRole` type in `/lib/types.ts`
```typescript
export type UserRole = 'member' | 'business' | 'admin' | 'sponsor' // Add 'sponsor'
```

2. **Update Login Redirect** - Add case in `login-client.tsx`
```typescript
if (user.role === 'sponsor') {
  router.push('/sponsor')
}
```

3. **Create Route Structure** - Create `/app/sponsor/page.tsx`

4. **Add Middleware Protection** - Use `requireRole('sponsor')`

5. **Update Signup** - Add option in signup form to select role

That's it! The system will auto-route new roles.

## Summary

Your current authentication system is **already following industry best practices**:

✅ **Single login page** - No separate admin login URL needed
✅ **Automatic role detection** - User role read from Firestore
✅ **Role-based routing** - Redirects to appropriate dashboard
✅ **Proper middleware** - Routes protected by role checks
✅ **Scalable design** - Easy to add new roles

**No changes needed** - Your architecture is correct and secure!
