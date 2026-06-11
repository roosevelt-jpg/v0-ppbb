# Admin Login & Integration Testing Guide - Passive Blessings

## ✅ Current Working Credentials

```
Email:       admin@passiveblessings.ae
Password:    Admin@123456
Access Code: PB-ADMIN-2025
Admin URL:   https://test.myflynai.com/admin
Setup URL:   https://test.myflynai.com/admin/setup
```

## Step-by-Step Login Instructions

### Step 1: Go to Setup Page
- Navigate to: **https://test.myflynai.com/admin/setup**
- You'll see the Admin Dashboard Setup (Step 1 of 3)

### Step 2: Enter Access Code
- Enter: **PB-ADMIN-2025**
- Click "Continue"

### Step 3: Email Verification (Step 2 of 3)
- Click "Next" (automatically proceeds)

### Step 4: Sign In with Admin Credentials
- Email: **admin@passiveblessings.ae**
- Password: **Admin@123456**
- Click "Sign In"

### Result
- You'll be redirected to: **https://test.myflynai.com/admin**
- First time loads: **https://test.myflynai.com/admin/integrations**

## Testing "Add Configuration" Modal

### Step-by-Step
1. Login using credentials above
2. Navigate to Integrations page
3. See 8 service cards:
   - Anthropic (Claude)
   - OpenAI
   - Stripe
   - SendGrid
   - YouTube API
   - Google Maps API
   - Firebase Admin SDK
   - Custom Webhook

4. Click **"Add Configuration"** button on any service card
5. Modal should appear with:
   - Service name as title
   - "Configure your API credentials" description
   - X button (top-right) to close
   - Form with dynamic fields based on service
   - "Cancel" and "Save Configuration" buttons

### Modal Technical Details
- **Position**: Fixed overlay (z-index: 50)
- **Backdrop**: Semi-transparent black (bg-black/50)
- **Width**: Max 448px (max-w-md)
- **Max Height**: 90% viewport with scroll if needed
- **Animation**: Smooth fade-in
- **Close Options**: X button or Cancel button
- **Form Validation**: Real-time field validation
- **Status Messages**: Success (green) / Error (red) notifications

## All Admin Dashboard Pages

Once logged in, you can access:
- ✅ **Overview** - Platform overview and stats
- ✅ **Members** - Manage community members
- ✅ **Team (About)** - Team management
- ✅ **Volunteers** - Track volunteer hours
- ✅ **Events** - Create and manage events
- ✅ **Charity Cases** - Manage charity initiatives
- ✅ **Donations** - Track donation transactions
- ✅ **Donation Causes** - Manage donation campaigns
- ✅ **Charity Partners** - Partner management
- ✅ **Sponsors** - Sponsor management
- ✅ **Businesses** - Business partners
- ✅ **Approvals** - Approve new registrations
- ✅ **Contact Requests** - Handle contact form submissions
- ✅ **Membership** - Membership management
- ✅ **Analytics** - Community analytics dashboard
- ✅ **Reporting** - Generate reports
- ✅ **Moderation** - Content moderation
- ✅ **Pages (CMS)** - Website page management
- ✅ **Policies** - Legal policies management
- ✅ **Integrations** - API configuration dashboard
- ✅ **Settings** - Site branding, SEO, analytics
- ✅ **System Health** - Real-time service health monitoring

## API Integrations Available for Configuration

| Service | Category | Description |
|---------|----------|-------------|
| Anthropic (Claude) | AI | AI-powered language model for text generation |
| OpenAI | AI | GPT models and other OpenAI services |
| Stripe | Payment | Payment processing and billing |
| SendGrid | Email | Email delivery and management service |
| YouTube API | Media | Video content management and search |
| Google Maps API | Maps | Maps, geocoding, and location services |
| Firebase Admin SDK | Database | Backend administration and database access |
| Custom Webhook | Other | Generic webhook endpoint configuration |

## What Happens After Configuring an API

1. **After clicking "Save Configuration"**
   - Credentials are validated
   - Success message appears (green)
   - Modal auto-closes after 1.5 seconds
   - Page refreshes to show updated status

2. **Service Status Shows**
   - Green checkmark: Healthy
   - Yellow warning: Degraded
   - Red X: Down/Error
   - Gray clock: Not configured

3. **Service Card Updates**
   - Buttons change from "Add Configuration" → "Edit", "Test", "Delete"
   - Status box shows current health
   - Last checked timestamp displayed
   - Response time shown in milliseconds

## Integration System Flow

```
User clicks "Add Configuration"
        ↓
Modal renders with service fields
        ↓
User fills API credentials
        ↓
Form validates on submit
        ↓
Success → Credentials saved to Firestore
        ↓
Health check runs automatically
        ↓
Status updates on card (green/yellow/red)
```

## Key Features

✅ **Secure Storage** - Credentials encrypted in Firestore
✅ **Real-time Health Monitoring** - Auto-checks service status
✅ **Form Validation** - Validates credentials before saving
✅ **Error Handling** - Clear error messages for failed configs
✅ **Dynamic Forms** - Fields adapt based on service type
✅ **Test Button** - Verify configuration works
✅ **Edit/Delete** - Update or remove configs
✅ **Stats Dashboard** - See configured vs healthy services

## Troubleshooting

### Modal Not Appearing?
- Check if you're properly authenticated (not redirected to setup)
- Open DevTools (F12) → Console for JavaScript errors
- Clear browser cache and refresh
- Try a different service card

### Form Not Submitting?
- Check all required fields are filled
- Look for red error messages below fields
- Verify API key format matches requirements
- Check browser console for validation errors

### Status Shows "Not Configured"?
- Service configuration may not be saved
- Try clicking "Add Configuration" again
- Verify credentials in form fields
- Click "Save Configuration"

## Next Steps

1. ✅ Log in with provided credentials
2. ✅ Navigate to Integrations page
3. ✅ Click "Add Configuration" on a service
4. ✅ Test the modal rendering
5. ✅ Try filling in sample API credentials
6. ✅ Click "Save Configuration" to persist
7. ✅ Verify service status updates

---

**Production Environment**: https://test.myflynai.com
**Admin Setup**: https://test.myflynai.com/admin/setup
**Direct Admin Access** (after login): https://test.myflynai.com/admin
