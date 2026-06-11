# Passive Blessings - Complete Login Credentials & Testing Guide

**Last Updated**: June 11, 2025  
**Status**: Production Ready  
**Platform URL**: https://v0-ppbb.vercel.app

---

## Quick Start Login

### Admin Portal Access
- **URL**: https://v0-ppbb.vercel.app/login
- **Click**: "Admin Portal" button
- **Access Code**: `ADMIN2025`
- **Email**: `admin@passiveblessings.com`
- **Password**: `Admin@PassiveBlessing2025`

### Member/Community Access
- **URL**: https://v0-ppbb.vercel.app/login
- **Click**: "Community Member" button (or "Sign up now" to register new)
- **Email**: Your email (create account or use demo)
- **Password**: Your password

### Business Partner Access
- **URL**: https://v0-ppbb.vercel.app/login
- **Click**: "Community Member" button, then sign up as Business
- **Email**: Your email
- **Password**: Your password

---

## Complete User Type Credentials

### 1. ADMIN USER
**Dashboard**: https://v0-ppbb.vercel.app/admin

| Field | Value |
|-------|-------|
| Email | `admin@passiveblessings.com` |
| Password | `Admin@PassiveBlessing2025` |
| Access Code | `ADMIN2025` |
| Role | admin |

**Admin Dashboard Features**:
- Analytics & Statistics
- Approval Management (members, businesses, sponsors)
- Member Management
- Business Management
- Charity Management
- Donation Tracking & Management
- Event Management & Creation
- Policy Management
- Pages (CMS) Management
- Integrations Management
- Settings & Branding
- Volunteer Management
- Community Moderation
- System Health Monitoring

**How to Log In**:
1. Go to https://v0-ppbb.vercel.app/login
2. Click **"Admin Portal"** button
3. Enter Access Code: `ADMIN2025`
4. Enter Email: `admin@passiveblessings.com`
5. Enter Password: `Admin@PassiveBlessing2025`
6. Click **"Sign In"**
7. You'll be redirected to: https://v0-ppbb.vercel.app/admin

---

### 2. MEMBER (Community User)
**Dashboard**: https://v0-ppbb.vercel.app/dashboard

**Option A: Demo Member Account** (if created)
| Field | Value |
|-------|-------|
| Email | `member@passiveblessings.com` |
| Password | `Member@123` |
| Role | member |

**Option B: Create New Account**
1. Go to https://v0-ppbb.vercel.app/login
2. Click **"Community Member"** button
3. Click **"Sign up now"**
4. Fill in registration form:
   - First Name
   - Last Name
   - Email
   - Password
   - Date of Birth
   - Gender
   - Nationality
   - Emirates ID (optional)
   - Location/Address
5. Click **"Create Account"**
6. You'll be logged in automatically to dashboard

**Member Dashboard Features**:
- Community Groups (view, join, create)
- Events (browse, register, manage)
- Volunteering (view opportunities, log hours)
- Marketplace (browse services, list services)
- Donations (donate, view history, set recurring)
- Donations (view certificates)
- Membership (upgrade tier, view benefits)
- Learning (view courses, track progress)
- Messages (community chat)
- Profile (edit, view settings)
- Charity Requests (view, contribute)

**How to Log In**:
1. Go to https://v0-ppbb.vercel.app/login
2. Click **"Community Member"** button (or skip if signing up)
3. Enter Email: your email
4. Enter Password: your password
5. Click **"Sign In"**
6. You'll be redirected to: https://v0-ppbb.vercel.app/dashboard

---

### 3. BUSINESS PARTNER
**Dashboard**: https://v0-ppbb.vercel.app/business

**Option A: Demo Business Account** (if created)
| Field | Value |
|-------|-------|
| Email | `business@passiveblessings.com` |
| Password | `Business@123` |
| Role | business |
| Business Name | Demo Business |

**Option B: Create New Account**
1. Go to https://v0-ppbb.vercel.app/login
2. Click **"Community Member"** button
3. Click **"Sign up now"**
4. During signup, select **Role**: "Business"
5. Fill in business information:
   - Business Name
   - Business Type
   - Registration Number
   - Contact Person Name
   - Email
   - Password
   - Phone
   - Address
   - Website (optional)
6. Click **"Create Account"**
7. Account will be pending admin approval

**Business Dashboard Features**:
- Business Profile (edit, view analytics)
- Marketplace Listings (create, edit, manage)
- Partnerships (manage, view opportunities)
- Analytics (view performance, leads, conversions)
- Leads (manage, respond)
- Offers (create, manage, track)
- Payments (view, manage)
- Sponsorship Opportunities (create, manage)
- Recurring Offers (manage subscriptions)

**How to Log In**:
1. Go to https://v0-ppbb.vercel.app/login
2. Click **"Community Member"** button
3. Enter Email: your business email
4. Enter Password: your password
5. Click **"Sign In"**
6. You'll be redirected to: https://v0-ppbb.vercel.app/business

---

### 4. SPONSOR
**Dashboard**: https://v0-ppbb.vercel.app/sponsor

| Field | Value |
|-------|-------|
| Email | Can be member or business |
| Password | Same as member/business |
| Role | Can be combined with member/business |

**Note**: Sponsor is typically a secondary role added to members or businesses who want to sponsor causes.

**Sponsor Dashboard Features**:
- Profile Management (view/edit sponsor details, budget)
- Sponsorship Marketplace (browse opportunities)
- Analytics (ROI tracking, impact metrics)
- Certificates & Recognition (view issued certificates)
- Partnerships (manage strategic partnerships)

**How to Access**:
1. Log in as a member or business
2. If you have sponsor role, navigate to: https://v0-ppbb.vercel.app/sponsor
3. Or click "Sponsor" in navigation menu

---

## System Architecture

### Authentication Flow

```
┌──────────────────────────┐
│    https://v0-ppbb.      │
│    vercel.app/login      │
└───────────┬──────────────┘
            │
    ┌───────┴────────┐
    │                │
    ▼                ▼
[Admin Portal]  [Community Member]
    │                │
    ▼                ▼
Access Code      Email/Password
+ Email/Password      │
                       ▼
                  Firebase Auth
                       │
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
    [Check User Role]     [Fetch Firestore]
            │
    ┌───────┼───────┬────────┐
    │       │       │        │
    ▼       ▼       ▼        ▼
  admin  business member   other
    │       │       │        │
    ▼       ▼       ▼        ▼
  /admin /business /dashboard /
```

### One Unified Login Page

All user types use the same login URL: **https://v0-ppbb.vercel.app/login**

- No need for separate `/admin/login` or `/business/login`
- System automatically detects user role from Firestore
- Redirects to appropriate dashboard based on role
- Admin mode activated with access code for extra security

---

## Testing Scenarios

### Scenario 1: Admin Testing
1. Log in with admin credentials
2. Go to `/admin/integrations`
3. Add a YouTube API key
4. Go to `/admin/policies`
5. Edit privacy policy with current timestamp
6. Go to `/admin/pages`
7. View all pages and verify CMS functionality
8. Go to `/admin` (main dashboard)
9. Verify all stats are real-time from Firestore

### Scenario 2: Member Testing
1. Create new member account or use demo credentials
2. Go to `/dashboard`
3. View community groups
4. Browse events
5. Test volunteer hours logging
6. Create a marketplace listing
7. Make a donation
8. View donation certificate
9. Edit profile

### Scenario 3: Business Testing
1. Create business account
2. Wait for admin approval (or admin can approve from dashboard)
3. Go to `/business`
4. Create marketplace listing
5. View analytics
6. Test sponsorship applications
7. Manage partnerships

### Scenario 4: Chatbot Testing
1. Visit any page (homepage recommended)
2. Look for chat icon in bottom-right corner
3. Verify icon is now **BLACK** (#111111) instead of blue
4. Click to open chat
5. Send a message
6. Verify header is black
7. Verify send button is black
8. Verify user message bubble is black

---

## URLs Reference

### Public Pages
- **Homepage**: https://v0-ppbb.vercel.app/
- **Events**: https://v0-ppbb.vercel.app/events
- **Marketplace**: https://v0-ppbb.vercel.app/marketplace
- **Donate**: https://v0-ppbb.vercel.app/donate
- **Login**: https://v0-ppbb.vercel.app/login
- **Sign Up**: https://v0-ppbb.vercel.app/signup

### Policies & Legal
- **Privacy Policy**: https://v0-ppbb.vercel.app/policies/privacy-policy
- **Terms & Conditions**: https://v0-ppbb.vercel.app/policies/terms-conditions
- **Code of Conduct**: https://v0-ppbb.vercel.app/policies/code-of-conduct

### Member Dashboards
- **Member Dashboard**: https://v0-ppbb.vercel.app/dashboard
- **Community**: https://v0-ppbb.vercel.app/dashboard/community
- **Events**: https://v0-ppbb.vercel.app/dashboard/events
- **Volunteering**: https://v0-ppbb.vercel.app/dashboard/volunteering
- **Marketplace**: https://v0-ppbb.vercel.app/dashboard/marketplace
- **Donations**: https://v0-ppbb.vercel.app/dashboard/donations
- **Profile**: https://v0-ppbb.vercel.app/dashboard/profile

### Business Dashboards
- **Business Dashboard**: https://v0-ppbb.vercel.app/business
- **Business Analytics**: https://v0-ppbb.vercel.app/business/analytics
- **Business Marketplace**: https://v0-ppbb.vercel.app/business/marketplace
- **Business Partnerships**: https://v0-ppbb.vercel.app/business/partnerships

### Sponsor Dashboard
- **Sponsor Dashboard**: https://v0-ppbb.vercel.app/sponsor
- **Sponsor Marketplace**: https://v0-ppbb.vercel.app/sponsor/marketplace
- **Sponsor Analytics**: https://v0-ppbb.vercel.app/sponsor/analytics
- **Sponsor Certificates**: https://v0-ppbb.vercel.app/sponsor/certificates

### Admin Dashboard
- **Admin Dashboard**: https://v0-ppbb.vercel.app/admin
- **Admin Members**: https://v0-ppbb.vercel.app/admin/members
- **Admin Events**: https://v0-ppbb.vercel.app/admin/events
- **Admin Donations**: https://v0-ppbb.vercel.app/admin/donations
- **Admin Policies**: https://v0-ppbb.vercel.app/admin/policies
- **Admin Pages**: https://v0-ppbb.vercel.app/admin/pages
- **Admin Integrations**: https://v0-ppbb.vercel.app/admin/integrations
- **Admin Settings**: https://v0-ppbb.vercel.app/admin/settings

---

## Important Security Notes

1. **Access Code System**: Admin users must enter access code first for security
2. **Password Requirements**: Minimum 8 characters recommended
3. **Session Persistence**: Sessions stored in local storage (Firebase)
4. **Logout**: Always log out from settings menu when done
5. **Firestore Security**: All operations protected by Firestore security rules
6. **Role-Based Access**: Dashboard access enforced by user role

---

## Troubleshooting

### "Access code not valid"
- Make sure access code is exactly: `ADMIN2025` (case-sensitive)
- Check Firestore to verify access code is set

### "Email or password incorrect"
- Verify email is exactly: `admin@passiveblessings.com`
- Verify password is exactly: `Admin@PassiveBlessing2025`
- Check CAPS LOCK

### Can't log in to member account
- Make sure account was created successfully
- Check email is correct
- Try resetting password if available

### Dashboard shows "Not Found"
- Log out and log back in
- Verify your user role is set correctly in Firestore
- Check URL is correct for your role

### Chatbot shows different color
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh page (Ctrl+Shift+R)
- Verify styles are updated to #111111 (brand black)

---

## Support & Questions

- **Admin Issues**: Check `/admin/health` for system status
- **Authentication Issues**: Check Firestore `users` collection for user documents
- **Payment Issues**: Check Stripe integration in `/admin/integrations`
- **Email Issues**: Check SendGrid integration in `/admin/integrations`

---

**Ready to test? Start here**: https://v0-ppbb.vercel.app/login
