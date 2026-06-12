# Test Credentials - Passive Blessings

## Overview
This document contains test accounts for different user roles in the Passive Blessings platform. Use these credentials to test the application across different user types and dashboards.

---

## 1. ADMIN ACCOUNT (Admin Portal)

| Field | Value |
|-------|-------|
| **Email** | `admin@passiveblessings.com` |
| **Password** | `Admin@PassiveBlessing2025` |
| **Access Code** | `ADMIN2025` |
| **Role** | Admin |
| **Access** | Full admin dashboard, analytics, approvals, settings |

### How to Login:
1. Visit: https://test.myflynai.com/login (or your live deployment URL)
2. Click **"Admin Portal"**
3. Enter Access Code: `ADMIN2025`
4. Enter Email: `admin@passiveblessings.com`
5. Enter Password: `Admin@PassiveBlessing2025`
6. Access admin dashboard at: `/admin`

---

## 2. BUSINESS ACCOUNT

| Field | Value |
|-------|-------|
| **Email** | `business@example.com` |
| **Password** | `Business@Test123` |
| **Role** | Business |
| **Account Type** | Business Partner |
| **Access** | Business dashboard, profile, partnerships |

### Business Profile:
- **Company Name**: Example Business Co.
- **Industry**: Technology & Services
- **Contact**: business@example.com
- **Phone**: +971-50-123-4567
- **Location**: Dubai, UAE

### How to Create This Account:
1. Visit: https://test.myflynai.com/signup
2. Choose **"Business Partner"** account type
3. Enter Email: `business@example.com`
4. Enter Password: `Business@Test123`
5. Complete business registration form with details above
6. Access business dashboard at: `/dashboard/business`

---

## 3. MEMBER ACCOUNT

| Field | Value |
|-------|-------|
| **Email** | `member@example.com` |
| **Password** | `Member@Test123` |
| **Role** | Member |
| **Account Type** | Regular Member |
| **Membership Tier** | Standard |
| **Access** | Member dashboard, events, donations, profile |

### Member Profile:
- **Full Name**: Ahmed Member
- **Phone**: +971-50-234-5678
- **Email**: member@example.com
- **Location**: Dubai, UAE
- **Interests**: Community, Charity, Events

### How to Create This Account:
1. Visit: https://test.myflynai.com/signup
2. Choose **"Join as Member"** account type
3. Enter Email: `member@example.com`
4. Enter Password: `Member@Test123`
5. Complete member registration form
6. Access member dashboard at: `/dashboard`

---

## 4. SPONSOR ACCOUNT

| Field | Value |
|-------|-------|
| **Email** | `sponsor@example.com` |
| **Password** | `Sponsor@Test123` |
| **Role** | Sponsor |
| **Account Type** | Corporate Sponsor |
| **Sponsorship Level** | Gold |
| **Access** | Sponsor dashboard, campaigns, partnerships |

### Sponsor Profile:
- **Organization Name**: Premium Sponsors Ltd.
- **Contact Person**: Fatima Sponsor
- **Email**: sponsor@example.com
- **Phone**: +971-50-345-6789
- **Sponsorship Level**: Gold
- **Website**: www.premiumsponsors.com

### How to Create This Account:
1. Visit: https://test.myflynai.com/signup
2. Choose **"Become a Sponsor"** account type
3. Enter Email: `sponsor@example.com`
4. Enter Password: `Sponsor@Test123`
5. Complete sponsor registration form with details above
6. Access sponsor dashboard at: `/dashboard/sponsor`

---

## 5. VOLUNTEER ACCOUNT (Bonus)

| Field | Value |
|-------|-------|
| **Email** | `volunteer@example.com` |
| **Password** | `Volunteer@Test123` |
| **Role** | Volunteer |
| **Account Type** | Volunteer |
| **Skills** | Tech, Marketing, Teaching |
| **Access** | Volunteer dashboard, events, hours tracking |

### Volunteer Profile:
- **Full Name**: Ali Volunteer
- **Email**: volunteer@example.com
- **Phone**: +971-50-456-7890
- **Skills**: Technology, Marketing, Teaching
- **Availability**: Weekdays & Weekends
- **Hours per Month**: 20

### How to Create This Account:
1. Visit: https://test.myflynai.com/signup
2. Choose **"Volunteer"** account type
3. Enter Email: `volunteer@example.com`
4. Enter Password: `Volunteer@Test123`
5. Complete volunteer registration
6. Access volunteer dashboard at: `/dashboard`

---

## Testing Guide

### Testing Different Dashboards:

**1. Business Dashboard:**
- Login with business@example.com
- View at: `/dashboard/business`
- Features: Partnership requests, business profile, analytics

**2. Member Dashboard:**
- Login with member@example.com
- View at: `/dashboard`
- Features: Events, donations, membership tier, profile

**3. Sponsor Dashboard:**
- Login with sponsor@example.com
- View at: `/dashboard/sponsor`
- Features: Campaigns, sponsorships, impact metrics

**4. Admin Dashboard:**
- Login with admin@passiveblessings.com (use access code ADMIN2025)
- View at: `/admin`
- Features: Full system control, analytics, approvals

---

## Security Notes

⚠️ **Important:**
- These are TEST credentials only
- Do NOT use these in production
- Change all passwords before going live
- Store actual credentials securely in environment variables
- Use Firebase Console to manage real user accounts
- Enable 2FA for admin accounts in production

---

## Account Creation Checklist

When creating new test accounts, ensure:

- [ ] Email is verified in Firebase Console
- [ ] Role is correctly set in Firestore `users` collection
- [ ] Profile data is complete
- [ ] Phone number is in correct format (+971-XX-XXX-XXXX for UAE)
- [ ] Location data is filled in
- [ ] Avatar/Photo is optional but recommended
- [ ] Account status is "active"
- [ ] All fields are validated before saving

---

## Firestore Collections Used

The system stores user data in these Firebase collections:

```
firestore/
├── users/
│   ├── {userId}/ (User document with profile, role, preferences)
│   └── Contains: email, firstName, lastName, role, phone, location, etc.
├── businesses/
│   └── {businessId}/ (Business partner profiles)
├── sponsors/
│   └── {sponsorId}/ (Sponsor organizations)
└── members/
    └── {memberId}/ (Member profiles)
```

---

## Password Requirements

All passwords must meet these requirements:
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (@, #, $, etc.)

Examples:
- ✅ `Business@Test123`
- ✅ `Member@Test123`
- ✅ `Sponsor@Test123`
- ❌ `password123` (no uppercase/special char)
- ❌ `Pass` (too short)

---

## Troubleshooting

**Issue: "Invalid credentials"**
- Check email spelling
- Verify password (case-sensitive)
- Ensure account is activated in Firebase
- Check if account exists in Firestore

**Issue: "Access denied"**
- Verify user role in Firestore `users` collection
- Check role matches account type
- Ensure user permissions are set correctly

**Issue: "Dashboard not found"**
- Verify role-based routing is configured
- Check `/app/[role]/dashboard/page.tsx` exists
- Clear browser cache and try again

---

## Quick Links

- **Main App**: https://test.myflynai.com
- **Login Page**: https://test.myflynai.com/login
- **Signup Page**: https://test.myflynai.com/signup
- **Admin Portal**: https://test.myflynai.com/admin
- **Member Dashboard**: https://test.myflynai.com/dashboard
- **Firebase Console**: https://console.firebase.google.com

---

**Last Updated**: 2026-06-12
**Status**: Ready for Testing
**Environment**: Production (https://test.myflynai.com)
