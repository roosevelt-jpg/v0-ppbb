# Admin Dashboard Redesign - Implementation Guide

## Phase 1: ✅ COMPLETE
Foundation and core system created. Admin overview page redesigned.

## Phase 2: Updating Remaining Admin Pages

### Quick Update Pattern for Each Page

For each admin page, follow this pattern:

1. **Add imports** at top:
```tsx
import { AdminPageLayout } from '@/components/admin-page-layout'
import { BUTTON_PRIMARY, FLEX_BETWEEN, TEXT_SECTION } from '@/lib/admin-design-system'
```

2. **Wrap return** with AdminPageLayout:
```tsx
return (
  <AdminPageLayout title="Page Title" subtitle="Description">
    {/* Existing page content here */}
  </AdminPageLayout>
)
```

3. **Update button classes**:
- Replace `bg-neutral-900 text-white` with `className={BUTTON_PRIMARY}`
- Replace `px-4 py-2` on buttons with `className={BUTTON_PRIMARY}`
- All buttons automatically get black (#111111) background + white text + hover effects

4. **Update headings**:
- Replace inline `<h1>` styling with `className={TEXT_SECTION}`
- Use `TEXT_SMALL` for subtitles

5. **Use responsive grid**:
- Replace custom grid with `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

### Pages to Update (Priority Order)

#### Tier 1 (Most Used - Update First)
- `/admin/members` - Members management
- `/admin/donations` - Donations tracking
- `/admin/events` - Event management
- `/admin/approvals` - Approval queue

#### Tier 2 (Important Features)
- `/admin/volunteers` - Volunteer management
- `/admin/sponsors` - Sponsor tracking
- `/admin/businesses` - Business management
- `/admin/pricing` - Pricing plans

#### Tier 3 (Config & Tools)
- `/admin/settings` - Platform settings
- `/admin/integrations` - API integrations
- `/admin/youtube-config` - YouTube setup
- `/admin/assets` - Hero slider management

#### Tier 4 (Content Management)
- `/admin/pages` - CMS pages
- `/admin/policies` - Policy management
- `/admin/moderation` - Moderation tools

### Available Utilities

**Buttons** (from `/lib/admin-design-system.ts`):
```tsx
BUTTON_PRIMARY      // Black bg, white text
BUTTON_SECONDARY    // Gray bg
BUTTON_DANGER       // Red bg
BUTTON_SUCCESS      // Green bg
BUTTON_SMALL        // Smaller size
BUTTON_LARGE        // Larger size
```

**Layout**:
```tsx
PAGE_CONTAINER      // min-h-screen bg-neutral-50
CONTENT_CONTAINER   // max-w-7xl mx-auto px-4-8 py-6-8
GRID_2COL           // 2 column responsive grid
GRID_3COL           // 3 column responsive grid
FLEX_BETWEEN        // flex items-center justify-between
FLEX_CENTER         // flex items-center justify-center
```

**Typography**:
```tsx
TEXT_HEADING        // Large page titles
TEXT_SUBHEADING     // Section titles
TEXT_SECTION        // Medium titles
TEXT_LABEL          // Form labels
TEXT_SMALL          // Small text
TEXT_MUTED          // Muted gray text
```

**Components** (from `/components/admin-components.tsx`):
```tsx
<AdminTable columns={[]} data={[]} loading={false} />
<AdminForm fields={[]} onSubmit={() => {}} />
<AdminCard title="Title">Content</AdminCard>
<AdminStats items={[{ label: '', value: 0 }]} />
```

### Real-Time Data Requirements

All pages MUST:
1. Use Firestore `onSnapshot` listeners (not `getDocs`)
2. Update state in real-time as data changes
3. Show loading states during fetch
4. Handle errors gracefully
5. Unsubscribe from listeners in useEffect cleanup

Example:
```tsx
useEffect(() => {
  const unsubscribe = onSnapshot(
    query(collection(db, 'users')),
    (snapshot) => {
      setData(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    },
    (error) => console.error('[v0] Error:', error)
  )
  return () => unsubscribe()
}, [])
```

### Button Action Requirements

All button clicks must:
1. Fire an action (create, update, delete, navigate)
2. Update Firestore immediately
3. Show loading state while processing
4. Display success/error messages
5. Disable button during processing

Example:
```tsx
const [loading, setLoading] = useState(false)

const handleSave = async () => {
  setLoading(true)
  try {
    await updateDoc(doc(db, 'collection', id), data)
    alert('Saved successfully!')
  } catch (error) {
    alert('Error: ' + error.message)
  } finally {
    setLoading(false)
  }
}

<button 
  onClick={handleSave} 
  disabled={loading}
  className={BUTTON_PRIMARY}
>
  {loading ? 'Saving...' : 'Save'}
</button>
```

### Mobile Responsiveness

All pages must:
1. Stack vertically on mobile (use responsive grid)
2. Hide non-essential columns in tables on mobile
3. Use full width on mobile, constrain on desktop
4. Test in browsers: Chrome mobile, Safari mobile

Grid pattern:
```tsx
// Mobile: 1 column, Tablet: 2 columns, Desktop: 3+ columns
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
```

### Deployment Checklist

For each page update:
- [ ] Wrap with AdminPageLayout
- [ ] Update button classes to BUTTON_PRIMARY
- [ ] Remove old dark mode classes
- [ ] Use responsive grids
- [ ] Test real-time data updates
- [ ] Verify all actions save to Firestore
- [ ] Test on mobile
- [ ] Build passes
- [ ] Deploy to production

### Current Status

✅ Completed:
- Design system created
- AdminPageLayout component
- Admin components library
- Overview page redesigned
- Deployment successful

📝 Next Steps:
- Update remaining pages following this guide
- Build and deploy incrementally
- Test all real-time features
- Verify Firestore sync works

