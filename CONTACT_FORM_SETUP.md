# Contact Form System - Admin Setup Guide

## Overview
The contact form system is **fully wired and operational**. When users submit contact requests via `/contact`, they are automatically saved to Firestore and appear in the admin dashboard at `/admin/contact-requests`. Admins can now:
- View all contact requests in a sortable table
- Click "View" to see full details and reply thread
- Send email replies directly from the dashboard
- Track reply status (sent/sending/failed)
- Mark requests as closed

## Setup Instructions

### Step 1: Get SendGrid Account
1. Go to https://sendgrid.com
2. Sign up for a free account (or use existing account)
3. Go to Settings → API Keys
4. Click "Create API Key"
5. Give it a name like "Passive Blessings"
6. Choose "Full Access" permissions
7. Copy the API key (you'll need this in the next step)

### Step 2: Add SendGrid API Key to Admin Dashboard
1. Go to `/admin/settings` in your admin panel
2. Scroll down to "API & Environment Credentials"
3. Find the "SendGrid" section
4. Paste your SendGrid API key into the "API Key" field
5. Click "Save"

### Step 3: Configure Sender Email (Optional)
The system uses `noreply@passiveblessings.ae` as the sender email by default. If you want to change this:

1. In SendGrid dashboard, go to Settings → Sender Authentication
2. Verify the domain or add a new sender email
3. The reply-to email is set to the contact email from admin settings (`support@passiveblessings.ae`)

## How It Works

### User Submits Contact Form
1. User fills out the contact form at `/contact`
2. Form data is saved to Firestore `contactRequests` collection
3. Admin sees it in `/admin/contact-requests` within seconds (real-time)

### Admin Views & Replies
1. Admin goes to `/admin/contact-requests`
2. Clicks "View" button on any request
3. Sees full message and conversation thread
4. Types a reply in the text area
5. Clicks "Send Reply"
6. Email is automatically sent to the user via SendGrid
7. Reply is saved in the conversation thread with status

### User Receives Reply
1. Email is sent from `noreply@passiveblessings.ae`
2. Reply contains the admin's message
3. User can reply to the email (it will go to `support@passiveblessings.ae`)

## Contact Request Statuses

- **new**: Unread contact request
- **read**: Admin has viewed the request
- **replied**: Admin has sent a reply
- **closed**: Request is marked as closed (no more replies)

## Email Template

The reply email includes:
- Admin's reply message
- Original subject line
- Professional footer with links
- Reply-to email address for user responses

## Troubleshooting

### "SendGrid not configured" error
- Go to `/admin/settings`
- Check that SendGrid API key is entered and saved
- Ensure API key has full access permissions

### Email fails to send but reply is saved
- This means Firestore saved the reply but SendGrid failed
- Check SendGrid API key is valid
- Check the status badge on the reply (should show "failed")
- Try sending again from the detail page

### Users not receiving emails
1. Check spam/junk folder
2. Verify sender domain in SendGrid dashboard
3. Check SendGrid bounce logs for delivery errors
4. Ensure reply-to email is correct in admin settings

## Advanced Settings

All contact-related settings can be managed in `/admin/settings`:
- **Email**: Set the support email (shown to users, used for reply-to)
- **Phone**: Display phone number on contact page
- **Address**: Display address on contact page
- **Social Links**: Display social media buttons

## API Integration Details

### Submitting Contact Form (Frontend)
```typescript
// app/contact/page.tsx
await addDoc(collection(db, 'contactRequests'), {
  name, email, phone, subject, message,
  status: 'new',
  createdAt: serverTimestamp(),
  read: false
})
```

### Sending Reply (Backend)
```typescript
// api/send-contact-reply/route.ts
POST /api/send-contact-reply
{
  toEmail: string,
  toName: string,
  subject: string,
  message: string
}
```

### Firestore Collections
- **contactRequests**: All contact form submissions
- **contactReplies**: All replies sent by admin
- **settings**: Site configuration including SendGrid API key

## Support

If you encounter issues:
1. Check admin settings are saved properly
2. Verify SendGrid account status is active
3. Check browser console for error messages
4. Review Firestore database rules to ensure admin can read/write
