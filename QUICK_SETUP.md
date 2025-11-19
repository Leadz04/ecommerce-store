# ⚡ Quick Setup Guide - Visitor Email Conversion System

## 🎯 What This Does

Automatically sends conversion emails to your email list subscribers when they visit your site, using discounts and urgency to convert them to customers.

## 🚀 3-Step Setup

### Step 1: Import Your Email List (2 minutes)

```bash
node scripts/import-email-subscribers.js
```

This imports all emails from `email-event_subscribers.csv` into your database.

### Step 2: Set Visitor Email (Choose One)

When a user visits your site, you need to identify their email. Choose one method:

#### Option A: Store in localStorage (Recommended)
```javascript
// When user provides email (signup, newsletter, etc.)
localStorage.setItem('visitor_email', 'user@example.com');
```

#### Option B: URL Parameter
```
https://yoursite.com/?email=user@example.com
```

#### Option C: Cookie
```javascript
document.cookie = `visitor_email=${encodeURIComponent('user@example.com')}; path=/; max-age=31536000`;
```

### Step 3: Done! 🎉

The system is already integrated! The `VisitorEmailTracker` component is in your layout and will automatically:
- ✅ Detect when subscribers visit
- ✅ Track their visits
- ✅ Send conversion emails with discounts
- ✅ Use increasing discounts (15% → 20% → 25%)

## 📧 How Emails Work

**First Visit** → Welcome email with **15% off**
**2-3 Visits** → Return visitor email with **20% off**  
**4+ Visits** → Urgent email with **25% off** (best offer)

## 🧪 Test It

1. Import your emails: `node scripts/import-email-subscribers.js`
2. Set an email: `localStorage.setItem('visitor_email', 'test@example.com')` (use an email from your CSV)
3. Visit your site
4. Check the email inbox - you should receive a conversion email!

## 📊 Monitor Results

Check your database:
```javascript
// See all subscribers
db.emailsubscribers.find()

// See conversion rate
db.emailsubscribers.countDocuments({ converted: true })
```

## 🎨 Customize

- **Email templates**: `src/lib/emailTemplates.ts`
- **Discount codes**: Edit `generateDiscountCode()` function
- **Email timing**: Edit logic in `src/app/api/email/track-visitor/route.ts`

## ⚠️ Important

- **Gmail limit**: 500 emails/day (system includes rate limiting)
- **Email frequency**: Minimum 24 hours between emails
- **No spam**: Only sends to subscribers who visit your site

## 📖 Full Documentation

See `VISITOR_EMAIL_CONVERSION_GUIDE.md` for complete details.

---

**That's it! Your visitor-to-customer email system is ready! 🚀**

