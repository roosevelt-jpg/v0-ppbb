# Debugging Admin Invite Email Sending

## Overview

If you don't receive admin invitation emails, follow this debugging guide to identify where the issue is occurring.

## Step-by-Step Debugging

### Step 1: Check Gmail SMTP Configuration

**Admin Dashboard:**
1. Navigate to **Admin > Integrations**
2. Find **Gmail SMTP** card
3. Verify:
   - ✅ Service is **Enabled** (toggle is ON)
   - ✅ **Gmail Email** filled in (e.g., noreply@company.com)
   - ✅ **Gmail App Password** is set (should show dots)

**Important:** You must use a **Gmail App Password**, NOT your regular Gmail password.
- [Get Gmail App Password](https://myaccount.google.com/apppasswords)
- Requires 2FA enabled on your Gmail account

### Step 2: Check Browser Console Logs

When you generate an invite, open DevTools (F12) → Console tab:

Look for these messages:

```
[v0] Generating access code with permissions: {
  adminName: "...",
  adminEmail: "...",
  role: "admin",
  selectedPermissions: [...],
  finalPermissions: [...]
}

[v0] Access code generation response: {
  success: true,
  hasData: true
}

[v0] Access code created: {
  code: "XXXXXXXX",
  permissions: [...]
}
```

**If you DON'T see these logs:**
- Invite form data may not be sending
- Check network tab for failed POST to `/api/admin/management`

### Step 3: Check Server Console/Logs

The detailed server-side logging shows:

**During Access Code Generation:**
```
[v0] Generating access code with data: {
  adminName: "...",
  adminEmail: "...",
  role: "admin",
  permissions: [...]
}

[v0] Saving access code to Firestore: {
  code: "XXXXXXXX",
  permissions: [...]
}

[v0] Access code saved successfully: {
  docId: "...",
  permissions: [...]
}

[v0] Triggering email send to: rsvltadom@yahoo.com
```

**During Email Sending:**
```
[v0] Creating Gmail transporter with: {
  email: "your-gmail@gmail.com",
  hasAppPassword: true
}

[v0] Gmail transporter created successfully

[v0] Sending admin invite email with config: {
  from: "...",
  to: "rsvltadom@yahoo.com",
  subject: "...",
  transporterExists: true
}

[v0] Admin invite email sent successfully: {
  messageId: "<..>",
  to: "rsvltadom@yahoo.com",
  timestamp: "..."
}
```

### Step 4: Common Issues & Solutions

#### Issue 1: Email Config Not Enabled
**Error Message:** `Email service not configured. Please configure Gmail SMTP in admin settings.`

**Solution:**
1. Go to Admin > Integrations
2. Find Gmail SMTP
3. Click Enable (toggle to ON)
4. Fill in all required fields
5. Save

#### Issue 2: Invalid Gmail App Password
**Error Message:** `Failed to create Gmail transporter` OR `invalid credentials`

**Solution:**
1. Ensure you're using an **App Password**, not your Gmail password
2. Generate new App Password:
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Windows Computer"
   - Copy the 16-character password
   - Paste into Admin > Integrations > Gmail SMTP
3. Make sure 2FA is enabled on your Gmail

#### Issue 3: Email Sent But Not Received
**Problem:** Email sending succeeds in logs but not in recipient inbox

**Possible Causes:**
1. **Spam Folder** - Check recipient's spam folder
2. **Email Provider Blocking** - Yahoo/Outlook may block unknown senders
3. **Gmail Rate Limit** - Too many emails sent too quickly
4. **Invalid Recipient** - Typo in email address

**Solutions:**
- Ask recipient to check spam folder
- Test with a personal Gmail account first
- Wait 30 minutes before sending another invite
- Verify email address has no typos

#### Issue 4: Permissions Not Saving
**Problem:** You select permissions but they don't appear in Firestore

**Debug Steps:**
1. Open browser Console
2. Look for:
   ```
   [v0] Generating access code with permissions: {
     selectedPermissions: ["manage_members", "manage_events"],
     finalPermissions: ["manage_members", "manage_events"]
   }
   ```
3. Check API response shows permissions:
   ```
   [v0] Access code created: {
     permissions: ["manage_members", "manage_events"]
   }
   ```
4. Open Firestore console, go to `admin-access-codes` collection
5. Find the code document and verify `permissions` field exists

### Step 5: Manual Email Test

If automated sending fails, manually trigger the email:

1. Generate access code via Admin panel
2. Copy the access code from the response
3. Open browser Console and run:
```javascript
fetch('/api/email/send-admin-invite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accessCode: 'XXXXXXXX',  // Use actual code
    adminEmail: 'rsvltadom@yahoo.com',
    adminName: 'John Doe',
    role: 'admin',
    expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString(),
    permissions: ['manage_members'],
  })
})
.then(r => r.json())
.then(d => console.log('[v0] Manual send result:', d))
```

Check Console output for success/error.

## Firestore Inspection

To verify data is being saved correctly:

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database**
4. Navigate to `admin-access-codes` collection
5. Check the latest document contains:
   - `code` - The access code
   - `adminName` - Admin name
   - `adminEmail` - Admin email
   - `permissions` - Array of permissions
   - `expiresAt` - Expiration timestamp
   - `used` - Should be `false` initially
   - `sendEmail` - Should be `true`

## Email Template

The invitation email should contain:

- ✅ Welcome with admin name
- ✅ Role badge (Admin/Super Admin)
- ✅ List of permissions granted
- ✅ Large, formatted access code
- ✅ Setup link with instructions
- ✅ 24-hour expiration warning
- ✅ Contact info for support

If email is received but missing any of these, the template may not be rendering correctly.

## Performance Notes

- Email sending is **async** - may take 1-5 seconds
- Check timestamps in logs to see exact sending time
- Gmail may rate-limit after ~500 emails/day
- App Passwords are specific to this application only

## Still Having Issues?

1. **Open DevTools Console (F12)** → share the `[v0]` log messages
2. **Check Firestore** → verify access code document structure
3. **Verify Gmail Setup:**
   - 2FA enabled on Google Account
   - App Password generated and copied correctly
   - Service enabled in Admin panel
4. **Test with different recipient email** (Gmail account first, then others)
5. **Check server logs** for email sending timestamps

## Security Notes

- App Passwords are stored encrypted in Firestore
- Never share your Gmail App Password
- Each app can have multiple App Passwords
- Revoke App Passwords in Google Account settings if compromised

---

**Last Updated:** June 27, 2026
**Build:** Production Ready
**Status:** All debugging tools implemented ✅
