# Admin Settings → Public Pages Sync Guide

## Overview

The admin settings page (`/admin/settings`) is now fully synced with public pages:
- **Contact Information** appears on `/contact` page and footer
- **Social Media Links** appear in `/contact` "Follow Us" section and footer

## How It Works

1. **Admin fills in settings** → `/admin/settings` page
2. **Data saved to Firestore** → `settings/global` document
3. **Public pages fetch data** → Contact page & footer retrieve and display

## Testing Procedure

### Step 1: Configure Contact Information

1. Navigate to **Admin > Settings**
2. Scroll to **Contact Information** section
3. Fill in:
   - **Email**: `support@passiveblessings.ae`
   - **Phone**: `+971 50 123 4567`
   - **Address**: `Dubai, UAE` (or your actual address)
4. Click **Save Settings**
5. Wait for success message

### Step 2: Configure Social Media Links

1. In same **Admin Settings** page
2. Scroll to **Social Media Links** section
3. Fill in at least one social link:
   - **Twitter URL**: `https://twitter.com/passiveblessings`
   - **Facebook URL**: `https://facebook.com/passiveblessings`
   - **Instagram URL**: `https://instagram.com/passiveblessings`
   - **LinkedIn URL**: `https://linkedin.com/company/passiveblessings`
   - **YouTube URL**: `https://youtube.com/@passiveblessings`
4. Click **Save Settings**
5. Wait for success message

### Step 3: Verify Contact Page

1. Navigate to **Public `/contact` page** (not logged in)
2. Look at the **left sidebar** "Contact Info" section
3. Should display:
   - Address you entered
   - Phone number (clickable tel: link)
   - Email (clickable mailto: link)
4. Below contact info, look for **"Follow Us"** section
5. Should display social media icons for links you configured

### Step 4: Verify Footer

1. Scroll to **bottom of any page**
2. Look at footer's **bottom right** corner
3. Should display social media icons (Facebook, Twitter, Instagram, etc.)
4. Click icons - should open the URLs you configured

## Expected Behavior

### Contact Page Left Sidebar

```
Contact Info
━━━━━━━━━━━━━
ADDRESS
Dubai, UAE

PHONE
+971 50 123 4567

EMAIL
support@passiveblessings.ae

FOLLOW US
[f] [t] [i] [in] [▶]  ← Social icons appear here
```

If no social links configured:
```
FOLLOW US
No social media links configured
```

### Footer Bottom Right

Before configuration:
```
Social links not configured
```

After configuration:
```
[f] [t] [i] [in] [▶]  ← Social icons appear here
```

## Debugging

### Check Browser Console

1. Open Developer Tools (F12)
2. Go to **Console** tab
3. Visit `/contact` page or scroll to footer
4. Look for messages:
   ```
   [v0] Contact page - Settings data: {...}
   [v0] Contact page - Contact info set: {...}
   [v0] Footer - Settings data: {...}
   [v0] Footer - Social links: {...}
   ```

### What These Logs Show

- **Settings data**: Full Firestore document contents
- **Contact info set**: What the page is using (email, phone, address, socialLinks)
- **Social links**: The links object that was retrieved

### If Data Not Showing

1. **Check Admin Save**: Verify you clicked "Save Settings" and got success message
2. **Check Console**: Look for any error messages
3. **Check Firestore**: Open Firebase Console → Firestore → `settings/global` collection
4. **Verify Data Structure**: The document should have:
   ```json
   {
     "email": "...",
     "phone": "...",
     "address": "...",
     "socialLinks": {
       "twitter": "...",
       "facebook": "...",
       ...
     }
   }
   ```

## Data Flow Diagram

```
Admin Settings Page (/admin/settings)
         ↓
  Clicks "Save Settings"
         ↓
  POST /api/settings
         ↓
  Firestore: settings/global
         ↓
  ┌──────────────────────────────┐
  │  Contact Page (/contact)     │
  │  - Left sidebar info         │
  │  - Follow Us section         │
  └──────────────────────────────┘
         ↑
  Fetch from settings/global
  
  Also used by:
  - Footer (all pages)
  - Any page that displays contact info
```

## Supported Fields

### Contact Information
- **email**: Contact email address
- **phone**: Phone number (with country code)
- **address**: Physical address or location

### Social Media Links
- **facebook**: Full Facebook profile URL
- **twitter**: Full Twitter profile URL
- **instagram**: Full Instagram profile URL
- **linkedin**: Full LinkedIn profile URL
- **youtube**: Full YouTube channel URL

## Common Issues & Solutions

### "No social media links configured" message appears

**Issue**: Social links saved but not displaying

**Solution**:
1. Check console logs (see Debugging section)
2. Open Firestore console, verify `socialLinks` object exists
3. Try saving again, ensure all fields are filled with valid URLs
4. Clear browser cache and reload

### Contact info shows placeholder/default values

**Issue**: Settings not being retrieved

**Solution**:
1. Verify you're logged in as admin
2. Check "Save Settings" succeeded (green message)
3. Check Firestore `settings/global` document exists
4. Try refreshing page after 2 seconds (Firebase sync delay)

### Social icons don't link to correct URLs

**Issue**: Links were saved but URLs are wrong

**Solution**:
1. Go back to `/admin/settings`
2. Verify URLs are correct (include `https://`)
3. Click Save Settings again
4. Refresh the page

## Performance Notes

- Settings are fetched once when page loads
- Changes appear after refresh (Firebase can take 1-2 seconds to sync)
- No real-time updates (page must be refreshed to see latest)
- Social links component is optimized - hidden if no links configured

## Next Steps

- Monitor console logs while testing
- Report any issues with data not syncing
- Verify social icons have correct hover effects
- Test on both desktop and mobile

---

**Last Updated**: June 27, 2026
**Status**: Fully Functional ✓
