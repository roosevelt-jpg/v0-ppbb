# QUICK REFERENCE CARD - Login & Testing

## START HERE
**Platform**: https://v0-ppbb.vercel.app/login

---

## ADMIN (One Unified Login Page)
```
Click: "Admin Portal"
Access Code: ADMIN2025
Email: admin@passiveblessings.com
Password: Admin@PassiveBlessing2025
Dashboard: https://v0-ppbb.vercel.app/admin
```

---

## MEMBER (One Unified Login Page)
```
Click: "Community Member"
Email: member@passiveblessings.com (or create new)
Password: Member@123 (or create new)
Dashboard: https://v0-ppbb.vercel.app/dashboard

To Sign Up:
1. Click "Sign up now"
2. Fill form (First/Last Name, Email, Password, DOB, etc)
3. Auto-logged in to dashboard
```

---

## BUSINESS (One Unified Login Page)
```
Click: "Community Member"
Email: business@passiveblessings.com (or create new)
Password: Business@123 (or create new)
Dashboard: https://v0-ppbb.vercel.app/business

To Sign Up:
1. Click "Sign up now"
2. Select Role: "Business"
3. Fill business form
4. Wait for admin approval
5. Access business dashboard after approval
```

---

## SPONSOR (One Unified Login Page)
```
Log in as Member or Business (same credentials)
Dashboard: https://v0-ppbb.vercel.app/sponsor
(Sponsor is a secondary role)
```

---

## CHATBOT COLOR FIX ✅
**Status**: COMPLETE
- Changed from blue to brand black (#111111)
- Hover states use charcoal (#333333)
- File: `/components/chat/chat-widget.tsx`
- All UI elements updated (button, header, messages, send button)

---

## KEY INFO
- **All users use SAME login page**
- **System auto-detects role and redirects**
- **Admin requires access code (ADMIN2025) first**
- **Members can self-register**
- **Businesses need admin approval**
- **One account per email address**

---

## ADMIN FEATURES
✓ Analytics
✓ Member Management
✓ Business Approvals
✓ Event Management
✓ Donation Tracking
✓ Policy Management
✓ Pages/CMS Management
✓ Integration Management
✓ Settings & Branding
✓ Sponsor Management
✓ Volunteer Tracking
✓ Community Moderation

---

## TESTING CHECKLIST
□ Log in as admin
□ Check integrations (YouTube, etc)
□ Edit policies & verify timestamp
□ Log in as member
□ Browse dashboard features
□ Log in as business
□ Check business dashboard
□ Test chatbot color (should be black)
□ Verify footer links work
□ Check YouTube videos display (3 columns)

---

**Ready?** Go to: https://v0-ppbb.vercel.app/login
