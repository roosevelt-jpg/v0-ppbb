# Admin Dashboard Setup Guide

## Quick Start

The Passive Blessings admin dashboard is fully configured and ready to use. All site settings, branding, and API integrations are managed through the admin panel.

**⚠️ IMPORTANT**: Please ensure you properly set up the admin dashboard settings. This is critical for the platform to work correctly. Don't skip this step!

## Accessing the Admin Dashboard

1. Navigate to `http://localhost:3000/admin`
2. Sign in with your admin account (same as the user login)
3. You'll see the Platform Overview dashboard

## Admin Dashboard Features

### 1. Platform Overview (`/admin`)
- Real-time statistics (total members, events, donations)
- Active business partnerships
- System health status
- Recent activity log

### 2. Settings (`/admin/settings`) - **START HERE**

This is where you configure everything about your platform:

#### Site Branding
- **Site Name**: Display name of your platform (default: "Passive Blessings")
- **Site Description**: Short description for SEO and homepage
- **Primary Color**: Main brand color (default: #111111 - Ink Black)
- **Secondary Color**: Background/neutral color (default: #f7f6f2 - Warm White)
- **Accent Color**: Highlights and CTAs (default: #888888 - Warm Grey)
- **Logo (Light)**: Logo for light backgrounds
- **Logo (Dark)**: Logo for dark backgrounds
- **Contact Email**: Main contact email address
- **Contact Phone**: Main contact phone
- **Address**: Organization address
- **Footer Text**: Custom footer message

#### API Integrations

**Stripe (Payments)**
- Add your Stripe Secret Key (sk_live_...)
- Toggle status to "Active" when ready
- Used for donation processing and payments

**SendGrid (Email)**
- Add your SendGrid API Key
- Toggle status to "Active" when ready
- Used for transactional emails and newsletters

### 3. CMS Pages (`/admin/pages`)

Create custom pages for your website:
- Title and description
- URL slug for routing
- SEO metadata (title, description, keywords)
- Rich content editor
- Publish/draft status
- Preview before publishing

### 4. System Health (`/admin/health`)

Monitor your integrations:
- Stripe status and response time
- SendGrid status and response time
- Firebase connectivity
- Real-time health checks

## Setup Workflow

### Step 1: Configure Site Settings (5 min)
1. Go to `/admin/settings`
2. Upload your organization's logos
3. Set brand colors
4. Update contact information
5. Click "Save Site Settings"

### Step 2: Add API Keys (3 min)
1. Add Stripe Secret Key (from dashboard.stripe.com)
2. Add SendGrid API Key (from app.sendgrid.com)
3. Toggle each to "Active"
4. Click "Save [Service] Config"

### Step 3: Create CMS Pages (10 min)
1. Go to `/admin/pages`
2. Create new pages for:
   - About Us
   - Volunteer Guidelines
   - Donation FAQ
   - Contact Us
3. Set appropriate slugs (e.g., `about-us`)
4. Publish when ready

### Step 4: Verify System Health (2 min)
1. Go to `/admin/health`
2. Check all services show "Healthy"
3. If services show "Down", verify API keys are correct

## How Data Flows

All settings are stored in Firestore:
- **siteSettings**: Collection that stores site configuration
- **apiConfigs**: Encrypted API key storage
- **pages**: CMS pages for dynamic content
- **auditLogs**: Tracks admin actions for security

### Default Initialization

On first load, the admin panel automatically creates default settings:
```javascript
{
  siteName: "Passive Blessings",
  siteDescription: "Community platform for events, volunteering, and community support",
  primaryColor: "#111111",
  secondaryColor: "#f7f6f2",
  accentColor: "#888888",
  email: "support@passiveblessings.ae",
  phone: "+971 50 000 0000",
  address: "Dubai, UAE",
}
```

## Features Powered by Admin Settings

### Homepage
- Uses site name, description, colors, and logo from settings
- Displays branding and contact info from settings

### Navigation
- Logo automatically switches between light/dark versions based on theme
- Uses brand colors for buttons and links

### Signup Form
- Brand colors applied to form styling
- Email address from settings for contact
- Navigation displays company info

### User Dashboard
- Brand colors applied throughout
- Contact information available in profile

### Emails (SendGrid)
- Transactional emails use sender email from settings
- Can customize email templates in SendGrid

### Payments (Stripe)
- Donation processing uses Stripe API key
- Webhook handlers validate transactions

## Security Notes

- API keys are encrypted with base64 encoding (upgrade to proper encryption in production)
- Only authenticated admin users can access settings
- All changes are logged in audit logs
- API keys are never displayed in full (marked with *)
- Sensitive data is redacted in list views

## Troubleshooting

### Settings Not Saving
- Check browser console for errors
- Verify Firebase is connected (check `/admin/health`)
- Ensure you have admin privileges

### API Keys Not Working
- Verify keys are correct in service dashboards
- Check key format (Stripe: sk_live_..., SendGrid: SG...)
- Make sure status is set to "Active"

### Branding Not Updating
- Clear browser cache (Ctrl+Shift+Delete)
- Refresh the page
- Check that settings were saved successfully

### System Health Shows "Down"
- Verify API keys are correct
- Check service status on Stripe/SendGrid dashboards
- Try re-saving the API configuration

## Environment Variables

The following environment variables should be set (they're added automatically):

```
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
```

For development, these are in `.env.local`. For production deployment to hosting platform, set them in project settings.

## Next Steps

1. Complete the setup steps above
2. Create welcome CMS pages
3. Test the signup form with your branding
4. Verify emails work with SendGrid
5. Test a donation with Stripe
6. Monitor system health regularly

## Support

For issues or questions:
- Check the system health dashboard
- Review audit logs for recent changes
- Check browser console for JavaScript errors
- Review Firestore console for data issues

---

**Admin Dashboard Version**: 1.0
**Last Updated**: June 2025
