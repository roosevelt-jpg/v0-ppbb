# Admin Login Guide - Passive Blessings

## Current Status
✅ Firebase authentication is now working
✅ Login page is deployed with two modes: Community Member & Admin Portal
✅ Access code system is implemented
✅ Logo is displaying correctly on login page

## Admin Login Credentials

**Email:** `admin@passiveblessings.com`
**Password:** `Admin@PassiveBlessing2025`
**Access Code:** You need to set this in your Firestore

## How to Set Your Admin Access Code

### Option 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your Passive Blessings project
3. Go to Firestore Database
4. Find the "users" collection
5. Find the document with email: `admin@passiveblessings.com`
6. Add a field called `accessCode` with a value like: `ADMIN2025` or any code you want
7. Save

### Option 2: Use Your Own Access Code
If you want a specific access code, just add it to the Firestore document:
- Field name: `accessCode`
- Field value: Any text you want (e.g., `SECRET123`, `PBADMIN`, etc.)

## Login Flow (After Setting Access Code)

1. Go to: https://v0-ppbb.vercel.app/login
2. Click on **"Admin Portal"** button
3. Enter your **Access Code** (the one you set in Firestore)
4. Click **"Next"**
5. Enter **Email:** `admin@passiveblessings.com`
6. Enter **Password:** `Admin@PassiveBlessing2025`
7. Click **"Sign In"**
8. You will be redirected to: https://v0-ppbb.vercel.app/admin

## Admin Dashboard Features Available

After login, you can access:
- **Analytics** - Community metrics and statistics
- **Approvals** - Approve member/business registrations
- **Businesses** - Manage business partners
- **Charity** - Manage charity initiatives
- **Donations** - Track all donations
- **Events** - Create and manage events
- **Health** - System health monitoring
- **Members** - Manage community members
- **Pages** - Manage website pages
- **Settings** - Configure site branding, logos, and settings
- **Sponsors** - Manage sponsors
- **Volunteers** - Track volunteer hours

## Community Member Login

If you want to create a regular community member account:
1. Click **"Community Member"** on the login page
2. Go to **"Sign up now"** link
3. Follow the signup form
4. You'll have full access to the member dashboard

## Troubleshooting

### "Access code not valid" error
- Make sure the `accessCode` field exists in your Firestore admin user document
- Check the spelling and capitalization

### "Email or password incorrect"
- Make sure you're using: `admin@passiveblessings.com` (exactly)
- Make sure you're using: `Admin@PassiveBlessing2025` (exactly)
- Check that CAPS LOCK is off

### Logo not showing
- Logo is now pulling from Firestore via the Logo component
- If logo doesn't appear, check that you've configured logos in admin settings

## Next Steps

1. Set your desired access code in Firestore
2. Log in using the Admin Portal
3. Go to Settings to upload your brand logos (if needed)
4. Configure your dashboard as needed

---

**Live Site:** https://v0-ppbb.vercel.app
**Login Page:** https://v0-ppbb.vercel.app/login
**Admin Panel:** https://v0-ppbb.vercel.app/admin (after login)
