# Cause-Specific Charity Partner Assignment

## Overview
Passive Blessings now supports assigning specific charity partners to individual donation causes. This allows for fine-grained control over which partner collects donations for each cause.

## Features

### 1. Admin Cause Assignment
Each donation cause can be assigned a specific charity partner:

**Location:** `/admin/causes`

**How to Assign:**
1. Click "Add New Cause" or "Edit" on existing cause
2. Select a partner from the "Select Charity Partner" dropdown
3. Click "Add Cause" or "Save Changes"
4. Assignment is saved to Firestore immediately

**Available Partners:**
- All active partners from the charityPartners collection
- Partners can be activated/deactivated in `/admin/partners`
- Easy switching between partners anytime

### 2. Public Donation Flow
When users donate, they see the partner assignment:

**Location:** `/donate`

**User Experience:**
1. User browses causes - each card shows assigned partner name
2. User clicks "Donate" on a cause
3. Modal opens showing:
   - **Primary Partner** (assigned partner for this cause) - highlighted in blue
   - **Alternative Partners** - other available partners
4. User selects payment method and is redirected to partner's payment page

### 3. Real-Time Updates
All assignments sync in real-time via Firestore:
- Admin updates cause → Partner field updated instantly
- Public page sees new assignment immediately
- No page refresh needed
- Changes visible to all users

## Data Structure

### Causes Collection
Each cause document now includes:
```javascript
{
  id: "cause_id",
  name: "Education Fund",
  description: "Support for student education",
  category: "education",
  targetAmount: 50000,
  currentAmount: 12500,
  image: "https://...",
  status: "active",
  partnerId: "partner_id", // NEW FIELD
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Admin Management

### Creating a Cause with Partner
1. Go to `/admin/causes`
2. Fill form:
   - Cause Name
   - Category
   - Target Amount
   - Image URL
   - **Select Charity Partner** ← Must select
   - Description
3. Click "Add Cause"

### Editing a Cause Partner
1. Go to `/admin/causes`
2. Find cause in table
3. Click "Edit" button
4. Update partner selection
5. Click "Save Changes"
6. Changes apply immediately

### Best Practices

**Partner Selection:**
- Choose the most appropriate partner for each cause
- Consider partner expertise and network
- Can change anytime from admin panel

**Multiple Causes with Same Partner:**
- Same partner can handle multiple causes
- Each cause is tracked separately
- Partner can see which causes direct donations to them

**Partner Switching:**
- Easy to switch causes to different partners
- Past donations remain with original partner
- New donations go to new partner

## Workflow Example

### Scenario: Education and Health using different partners

1. **Create Education Cause**
   - Name: "Student Scholarships"
   - Partner: Beit Al Khair (Education-focused)

2. **Create Health Cause**
   - Name: "Medical Aid"
   - Partner: Hope Foundation (Health-focused)

3. **Public Page Shows:**
   - Student Scholarships card: "Partner: Beit Al Khair"
   - Medical Aid card: "Partner: Hope Foundation"

4. **User Donates to Student Scholarships:**
   - Sees "Primary Partner: Beit Al Khair"
   - Redirected to Beit Al Khair's payment page
   - Donation tracked under Education + Beit Al Khair

5. **User Donates to Medical Aid:**
   - Sees "Primary Partner: Hope Foundation"
   - Redirected to Hope Foundation's payment page
   - Donation tracked under Health + Hope Foundation

## Front-End Display

### Cause Cards
Each cause card displays:
```
[Image]
[Category Badge]
[Cause Name]
[Description]
Partner: [Partner Name]  ← NEW
[Progress Bar]
[Donate Button]
```

### Donation Modal - Primary Partner
```
━━━━━━━━━━━━━━━━━━━━━━━
Recommended Partner for this Cause:
[Partner Name] [Primary Partner Badge]
[Description]
[Arrow Button]
━━━━━━━━━━━━━━━━━━━━━━━
```

### Donation Modal - Alternatives
```
━━━━━━━━━━━━━━━━━━━━━━━
Alternative Partners:
[Partner 2 Name]
[Description]
[Arrow Button]

[Partner 3 Name]
[Description]
[Arrow Button]
━━━━━━━━━━━━━━━━━━━━━━━
```

## API / Data Access

### Firestore Queries

**Get cause with partner details:**
```javascript
onSnapshot(doc(db, 'causes', causeId), (doc) => {
  const cause = doc.data()
  const partnerId = cause.partnerId
  // Use partnerId to fetch partner details from charityPartners
})
```

**Get all causes with partners:**
```javascript
onSnapshot(query(collection(db, 'causes'), where('status', '==', 'active')), 
  (snapshot) => {
    const causesWithPartners = snapshot.docs.map(doc => ({
      ...doc.data(),
      partnerId: doc.data().partnerId
    }))
  }
)
```

## Benefits

✅ **Admin Control** - Assign/change partners without code changes
✅ **Transparency** - Donors see which partner handles their donation
✅ **Flexibility** - Different causes use different partners
✅ **Scalability** - Support multiple partners simultaneously
✅ **Real-Time** - Changes apply instantly across platform
✅ **Easy Management** - Simple dropdown in admin panel

## Troubleshooting

**Partner not showing on cause?**
- Ensure partner status is "active" in `/admin/partners`
- Refresh the admin causes page
- Check Firestore for partnerId field

**Different partner shows on donation modal?**
- Partners list refreshes from Firestore
- Ensure partner hasn't been deleted
- Check alternative partners list

**Need to unassign a partner?**
- Edit the cause
- Select "-" or empty option from partner dropdown
- All partners will show as alternatives

## Future Enhancements

Possible future features:
- Default partner selection for quick cause creation
- Partner-specific cause categories
- Automatic cause-partner recommendations
- Partner performance metrics by cause
- Cause-level donation tracking per partner

## Summary

The cause-specific partner assignment system gives admin complete flexibility to direct donations through appropriate partners while maintaining transparency for donors. All changes are instant and real-time across the entire platform.
