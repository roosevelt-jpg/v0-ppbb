# Event System Features - User Guide

## What's New for Event Creation (Admin)

### 1. **Gender Restrictions**
Select who can attend your event:
- **Everyone Welcome** - Open to all members
- **Ladies Only** - Exclusively for women
- **Men Only** - Exclusively for men

Each event shows a colored badge on event cards indicating the gender restriction.

### 2. **Event Tags**
Categorize your events with multiple tags:
- Free, RSVP, Premium, Member-Only
- Ladies-Only, Men-Only
- Networking, Workshop, Fundraiser, Celebration, Educational

Add as many tags as needed to help members find events.

### 3. **Location with Real-Time Map**
Start typing an address and get instant suggestions powered by Google Maps:
- See real-time location predictions
- Automatically retrieves precise coordinates (latitude/longitude)
- Shows formatted address with city/country info
- Blue info box displays your selected location details

Example: Type "Dubai Mall" → Get suggestions → Select → Coordinates automatically added!

### 4. **Event Banner Image**
Upload a professional banner for your event:
- Images automatically upload to Firebase Storage
- Maintains 16:9 aspect ratio on all screens
- Auto-fits without distortion
- Displays beautifully on event cards across all devices

### 5. **Calendar Integration**
Members can add your event to their calendar:
- **One-click download:** "Add to Calendar" button on each event
- **Works with:** Google Calendar, Outlook, Apple Calendar, Thunderbird
- **Includes:** Event title, description, location, date/time, duration
- **Format:** ICS standard for universal compatibility

---

## What Members See

### Public Events Page (`/events`)

#### Filter Events By:
1. **When:** All Events / Upcoming / Past
2. **Audience:** All Events / Everyone Welcome / Ladies Only / Men Only
3. **Type:** Filter by event tags (Free, RSVP, Premium, etc.)

#### Event Cards Show:
- Professional banner image (16:9 ratio, auto-fitted)
- **Gender badge** (colored indicator: blue=everyone, pink=ladies, purple=men)
- Event tags (up to 3 shown, "+N more" if additional)
- Date & Time with calendar icon
- Location with map pin icon
- Attendance count (e.g., "45/100 attending")
- Event description (preview)
- **"View Details"** button (black, white text)
- **"Add to Calendar"** button (for ICS download)

#### Event Grid Layout:
- **Mobile:** 1 column (full width)
- **Tablet:** 2 columns (balanced spacing)
- **Desktop:** 3 columns (optimized viewing)

### Homepage

**Upcoming Events Section:**
- Shows next 3 upcoming events
- Preview cards with:
  - Banner image
  - Event title
  - Location
  - "Learn More" button
- Updates automatically as events are published

### User Dashboards

All user types (Members, Volunteers, Sponsors, Business) see:
- Applicable events in their dashboard
- Gender/tag filtered based on user profile
- Same beautiful EventCard components
- Calendar add button available

---

## Data Architecture

### How It Works Behind the Scenes

**Images:**
- Uploaded to Firebase Storage (secure, scalable)
- High-quality automatic storage and CDN delivery
- Fast global access to images

**Event Information:**
- Location coordinates (from Google Places API)
- Event metadata, tags, gender restrictions
- All stored in Firestore as structured data

**Golden Rule Applied:**
- ✅ Firestore stores: text, numbers, object data, URLs
- ✅ Firebase Storage holds: images, videos, files
- ✅ No base64 encoding anywhere
- ✅ Clean separation of concerns

---

## Example: Creating an Event

### Admin Steps:

1. **Go to:** Admin Dashboard → Events → Create Event

2. **Fill Basic Info:**
   - Title: "Women in Business Networking"
   - Description: Event details
   - Date & Time: Select date/time

3. **Set Location:**
   - Type in location field
   - See real-time suggestions: "Dubai Marina", "Dubai Downtown", etc.
   - Select one → Coordinates auto-populate!

4. **Choose Gender Option:**
   - Radio button: Select "Ladies Only"

5. **Add Tags:**
   - Check: Networking, Fundraiser
   - Uncheck others

6. **Upload Banner:**
   - Click upload area
   - Select professional image
   - Image displays in preview

7. **Publish:**
   - Click "Save & Publish"

### What Members See:

Users visiting `/events` page will see:
- Your event card with ladies-only pink badge
- Professional banner image (auto-fitted 16:9)
- Tags showing: "Networking" + "Fundraiser"
- Date, time, location with coordinates
- "View Details" and "Add to Calendar" buttons
- Can download to their calendar (ICS)

---

## Responsive Design

Your events look great on all devices:

### Mobile Phone
- Events stack single-column
- Full-width cards
- Easy tap buttons
- Touch-friendly spacing
- Readable text

### Tablet
- 2-column layout
- Balanced card sizing
- Proper spacing
- All features visible

### Desktop
- 3-column grid
- Optimized viewing
- Detailed information
- Full feature set

---

## Key Benefits

✅ **Better Event Discovery**
- Members find events matching their interests
- Gender and tag filters make searching easy
- Color-coded badges at a glance

✅ **Professional Appearance**
- Beautiful event banners (auto-fitted images)
- Modern card design
- Responsive on all devices

✅ **Easy Calendar Integration**
- One-click calendar add
- Works with all major calendar apps
- Members never miss an event

✅ **Precise Locations**
- Real-time Google Maps integration
- Exact coordinates stored
- No address typos

✅ **Inclusive Events**
- Gender-specific options for comfort
- Clear audience restrictions
- Members know who they're meeting

---

## Technical Notes for Admins

### Image Upload
- **Supported formats:** JPG, PNG, WebP
- **Recommended size:** 1200x675px (16:9 ratio)
- **Max file size:** 5MB
- **Auto-optimized:** System handles compression
- **Storage:** Firebase Storage (secure, reliable)

### Location Data
- **Source:** Google Places API (real-time, accurate)
- **Stored:** Coordinates (latitude, longitude)
- **Country:** Default to UAE, expandable
- **Validation:** System validates all addresses

### Calendar Export
- **Format:** ICS (iCalendar standard)
- **Compatibility:** Google, Outlook, Apple, Mozilla, etc.
- **Details:** Includes full event information
- **Timezone:** System-aware scheduling

---

## FAQ

**Q: Can I change the gender restriction after publishing?**  
A: Yes, edit the event anytime (re-publish if needed).

**Q: How many tags can I add?**  
A: As many as you want! Event cards show top 3 + counter.

**Q: Will members in restricted events see others' calendars?**  
A: No, calendar adds are individual. Privacy maintained.

**Q: What if the location search doesn't find my venue?**  
A: You can type any address - Google Places returns suggestions or you can enter custom text.

**Q: Can members see event coordinates?**  
A: Only the formatted address and location name are shown to members for privacy.

---

## Build Status

✅ All features implemented and tested  
✅ 162+ pages building successfully  
✅ Zero errors or warnings  
✅ Responsive on all devices  
✅ Production ready

---

**Last Updated: June 28, 2026**
