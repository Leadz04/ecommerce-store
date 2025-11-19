# 🎯 Visitor-to-Customer Email Conversion System

## Overview

This system automatically detects when email subscribers visit your site and sends them conversion-focused emails to turn them into customers. It uses your existing Nodemailer setup and works with your CSV email list.

## 🚀 Quick Start

### Step 1: Import Your Email List

First, import your CSV file with email addresses:

```bash
# Install csv-parser if not already installed
npm install csv-parser

# Run the import script
node scripts/import-email-subscribers.js
```

This will:
- Read `email-event_subscribers.csv` from your project root
- Import all valid email addresses into MongoDB
- Skip duplicates automatically
- Mark them as active subscribers

### Step 2: Add Visitor Tracking to Your Site

Add the `VisitorEmailTracker` component to your layout:

**File: `src/app/layout.tsx`**

```tsx
import VisitorEmailTracker from '@/components/VisitorEmailTracker';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <VisitorEmailTracker />
        {children}
      </body>
    </html>
  );
}
```

### Step 3: Set Visitor Email (Choose One Method)

The system needs to know which email belongs to the visitor. Choose one of these methods:

#### Option A: Store Email in localStorage (Recommended)

When a user signs up or provides their email, store it:

```javascript
// After user provides email (signup, newsletter, etc.)
localStorage.setItem('visitor_email', userEmail);
```

#### Option B: Set Email via URL Parameter

Add email to URL when sending traffic:
```
https://yoursite.com/?email=user@example.com
```

#### Option C: Set Email in Cookie

Set a cookie when user provides email:
```javascript
document.cookie = `visitor_email=${encodeURIComponent(userEmail)}; path=/; max-age=31536000`;
```

### Step 4: Test the System

1. **Import your emails**: Run the import script
2. **Visit your site**: With an email from your list stored (localStorage/cookie/URL)
3. **Check logs**: The system will automatically track the visit
4. **Check email**: The subscriber should receive a conversion email

## 📧 How It Works

### Automatic Email Triggers

The system sends emails based on visitor behavior:

1. **First Visit** → Welcome Email (15% discount)
   - Triggered: When `visitCount === 1`
   - Discount: 15% off
   - Code: `WELCOME15XXX`

2. **Return Visit** (2-3 visits) → Return Visitor Email (20% discount)
   - Triggered: When `visitCount === 2-3` and no email sent in 48 hours
   - Discount: 20% off
   - Code: `RETURN20XXX`

3. **Multiple Visits** (4+ visits) → Urgent Email (25% discount)
   - Triggered: When `visitCount >= 4` and no email sent in 72 hours
   - Discount: 25% off (best offer)
   - Code: `URGENT25XXX`

### Email Frequency Limits

- **Minimum 24 hours** between emails to the same subscriber
- **Automatic rate limiting** to respect Gmail's 500 emails/day limit
- **No emails to converted customers** (already made a purchase)

## 🎨 Email Templates

Three conversion-focused email templates are included:

1. **Welcome Email** (`generateWelcomeConversionEmail`)
   - Warm, welcoming tone
   - 15% discount code
   - Product recommendations
   - Trust signals

2. **Return Visitor Email** (`generateReturnVisitorEmail`)
   - Re-engagement focused
   - 20% discount code
   - Stronger urgency
   - Trending products

3. **Urgent Conversion Email** (`generateUrgentConversionEmail`)
   - Highest discount (25%)
   - Maximum urgency
   - 48-hour expiration
   - Social proof

## 🔧 API Endpoints

### 1. Track Visitor Visit

**POST** `/api/email/track-visitor`

Tracks when a subscriber visits your site.

```javascript
fetch('/api/email/track-visitor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    page: '/products',
    referrer: 'https://google.com'
  })
});
```

**Response:**
```json
{
  "success": true,
  "subscriber": {
    "email": "user@example.com",
    "visitCount": 2,
    "lastVisited": "2024-01-15T10:30:00Z",
    "converted": false,
    "shouldSendEmail": true
  }
}
```

### 2. Send Conversion Email

**POST** `/api/email/send-conversion`

Sends a conversion email to a subscriber.

```javascript
fetch('/api/email/send-conversion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    emailType: 'welcome' // or 'return', 'urgent', or omit for auto
  })
});
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "emailType": "welcome",
  "discountCode": "WELCOME15123",
  "discountPercent": 15
}
```

### 3. Batch Send Emails

**GET** `/api/email/send-conversion?limit=10&type=welcome`

Sends emails to multiple eligible subscribers.

**Query Parameters:**
- `limit`: Number of emails to send (default: 10)
- `type`: Email type - `welcome`, `return`, `urgent`, or `auto` (default: auto)

**Example:**
```bash
# Send welcome emails to 20 first-time visitors
curl "http://localhost:3000/api/email/send-conversion?limit=20&type=welcome"

# Send urgent emails to 10 high-visit subscribers
curl "http://localhost:3000/api/email/send-conversion?limit=10&type=urgent"
```

## 📊 Database Model

### EmailSubscriber Schema

```typescript
{
  email: string;              // Unique email address
  firstName?: string;         // Optional first name
  lastName?: string;          // Optional last name
  source: string;            // 'csv', 'website', 'manual', etc.
  isActive: boolean;         // Active subscriber
  lastVisited?: Date;        // Last site visit
  visitCount: number;        // Total visits
  lastEmailSent?: Date;      // Last email sent
  emailSentCount: number;     // Total emails sent
  converted: boolean;        // Made a purchase?
  conversionDate?: Date;     // When they converted
  tags?: string[];           // Tags for segmentation
  metadata?: Map;            // Additional data
  createdAt: Date;
  updatedAt: Date;
}
```

## 🎯 Conversion Techniques Used

### 1. Discount Codes
- **Welcome**: 15% off first order
- **Return**: 20% off (stronger incentive)
- **Urgent**: 25% off (best offer)

### 2. Urgency & Scarcity
- Limited time offers
- Expiration dates (7 days, 5 days, 48 hours)
- Countdown messaging
- "Last chance" language

### 3. Personalization
- First name in greeting
- Visit count-based offers
- Product recommendations
- Dynamic discount codes

### 4. Social Proof
- "Join 10,000+ happy customers"
- Trust signals (free shipping, returns, secure payment)
- Customer testimonials

### 5. Clear CTAs
- Prominent "Shop Now" buttons
- Direct links to products
- Discount code prominently displayed

## 🔄 Workflow Example

1. **User visits site** → `VisitorEmailTracker` detects email
2. **System tracks visit** → Updates `visitCount` in database
3. **System checks eligibility** → Determines if email should be sent
4. **Email sent automatically** → Conversion email with discount code
5. **User clicks email** → Lands on site with discount code in URL
6. **User makes purchase** → Mark as `converted: true` (manual or automatic)

## 🛠️ Advanced Usage

### Manual Email Sending

Send emails manually via API:

```javascript
// Send welcome email
await fetch('/api/email/send-conversion', {
  method: 'POST',
  body: JSON.stringify({
    email: 'user@example.com',
    emailType: 'welcome'
  })
});
```

### Batch Processing

Run batch email sends (useful for cron jobs):

```bash
# Send to all eligible subscribers
curl "http://localhost:3000/api/email/send-conversion?limit=50&type=auto"
```

### Custom Email Types

You can create custom email templates in `src/lib/emailTemplates.ts`:

```typescript
export function generateCustomEmail(data: ConversionEmailData): string {
  // Your custom template
}
```

### Integration with Order System

When a subscriber makes a purchase, mark them as converted:

```javascript
// In your order completion handler
await EmailSubscriber.findOneAndUpdate(
  { email: customerEmail },
  {
    converted: true,
    conversionDate: new Date()
  }
);
```

## 📈 Monitoring & Analytics

### Check Subscriber Status

```javascript
// Get subscriber info
const subscriber = await EmailSubscriber.findOne({ email: 'user@example.com' });
console.log({
  visits: subscriber.visitCount,
  emailsSent: subscriber.emailSentCount,
  converted: subscriber.converted,
  lastVisit: subscriber.lastVisited
});
```

### Track Conversion Rate

```javascript
const total = await EmailSubscriber.countDocuments({ isActive: true });
const converted = await EmailSubscriber.countDocuments({ converted: true });
const conversionRate = (converted / total) * 100;
console.log(`Conversion Rate: ${conversionRate.toFixed(2)}%`);
```

## ⚠️ Important Notes

### Gmail Limits
- **500 emails per day** (Gmail SMTP limit)
- System includes 1-second delay between batch emails
- Monitor your sending to stay within limits

### Email Deliverability
- Use proper SPF/DKIM records
- Avoid spam trigger words
- Keep unsubscribe links
- Monitor bounce rates

### Privacy & Compliance
- Get consent before sending emails
- Include unsubscribe links
- Respect CAN-SPAM, GDPR, CASL
- Store consent records

## 🐛 Troubleshooting

### Emails Not Sending

1. **Check Gmail credentials**: Verify `EMAIL_USER` and `EMAIL_PASS` in `.env.local`
2. **Check Gmail app password**: Must use app password, not regular password
3. **Check daily limit**: Gmail allows 500 emails/day
4. **Check logs**: Look for error messages in console

### Visitors Not Being Tracked

1. **Check email storage**: Verify email is stored in localStorage/cookie
2. **Check component**: Ensure `VisitorEmailTracker` is in layout
3. **Check API**: Test `/api/email/track-visitor` endpoint
4. **Check database**: Verify subscriber exists in MongoDB

### Import Issues

1. **CSV format**: Ensure CSV has "Email" column header
2. **File location**: CSV must be in project root
3. **Database connection**: Verify `MONGODB_URI` is correct
4. **Dependencies**: Install `csv-parser` package

## 🎉 Next Steps

1. ✅ Import your email list
2. ✅ Add `VisitorEmailTracker` to layout
3. ✅ Set up email storage (localStorage/cookie)
4. ✅ Test with a few emails
5. ✅ Monitor conversion rates
6. ✅ Optimize email content based on results

## 📞 Support

If you encounter issues:
1. Check the console logs
2. Verify environment variables
3. Test API endpoints manually
4. Check MongoDB connection
5. Review email templates

---

**Happy Converting! 🚀**

