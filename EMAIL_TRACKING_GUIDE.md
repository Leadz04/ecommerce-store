# 📊 Email Tracking & Analytics System

## Overview

This comprehensive tracking system monitors:
- ✅ **Email Opens** - When subscribers open your emails
- ✅ **Email Clicks** - When subscribers click links in emails
- ✅ **Page Visits** - Every page subscribers visit on your site
- ✅ **Product Views** - Specific product pages viewed
- ✅ **Conversion Tracking** - When email subscribers become customers

## 🎯 What Gets Tracked

### 1. Email Opens
- **How**: Invisible 1x1 pixel image in every email
- **When**: Email is opened (image loads)
- **Data Tracked**:
  - Open timestamp
  - Open count (multiple opens)
  - First open vs. subsequent opens
  - User agent, IP address

### 2. Email Clicks
- **How**: All email links are wrapped with tracking URLs
- **When**: Subscriber clicks any link in email
- **Data Tracked**:
  - Click timestamp
  - Clicked URL
  - Link type (product, category, home, checkout)
  - Product ID (if product link)
  - Click count

### 3. Page Visits
- **How**: Automatic tracking when subscriber visits any page
- **When**: Every page load
- **Data Tracked**:
  - Page path
  - Page type (home, product, category, cart, checkout)
  - Visit timestamp
  - Product ID (if product page)
  - Whether they came from email

### 4. Product Views
- **How**: Special tracking for product pages
- **When**: Subscriber views a product page
- **Data Tracked**:
  - Product ID
  - Product name
  - View timestamp
  - Whether they came from email

## 📊 Database Models

### EmailTracking Model

Stores comprehensive tracking data for each email sent:

```typescript
{
  email: string;
  subscriberId: ObjectId;
  emailType: 'welcome' | 'return' | 'urgent' | 'promotional' | 'newsletter';
  emailSentAt: Date;
  
  // Open tracking
  opened: boolean;
  openedAt?: Date;
  openCount: number;
  lastOpenedAt?: Date;
  
  // Click tracking
  clicked: boolean;
  clickedAt?: Date;
  clickCount: number;
  clickedLinks: Array<{
    url: string;
    clickedAt: Date;
    linkType: 'product' | 'category' | 'home' | 'checkout' | 'other';
    productId?: string;
  }>;
  
  // Visit tracking
  visited: boolean;
  visitedAt?: Date;
  visitCount: number;
  visitedPages: Array<{
    page: string;
    visitedAt: Date;
    pageType: 'home' | 'product' | 'category' | 'cart' | 'checkout' | 'other';
    productId?: string;
  }>;
  
  // Product views
  productViews: Array<{
    productId: string;
    productName: string;
    viewedAt: Date;
    fromEmail: boolean;
  }>;
  
  // Conversion
  converted: boolean;
  convertedAt?: Date;
  orderId?: string;
}
```

## 🔧 How It Works

### Email Open Tracking

1. **Email Sent**: System creates `EmailTracking` record
2. **Tracking Pixel Added**: Invisible image added to email HTML
3. **Email Opened**: Pixel loads → calls `/api/email/track-open`
4. **Record Updated**: `opened: true`, `openCount++`, `openedAt` set

**Tracking Pixel URL:**
```
/api/email/track-open?token={base64_encoded_email_and_trackingId}
```

### Email Click Tracking

1. **Links Wrapped**: All email links wrapped with tracking URLs
2. **Link Clicked**: Subscriber clicks link
3. **Redirect**: `/api/email/track-click` records click
4. **Redirect to Destination**: User redirected to actual URL
5. **Record Updated**: `clicked: true`, `clickCount++`, link added to `clickedLinks`

**Tracked Link Format:**
```
/api/email/track-click?token={token}&url={encoded_destination_url}
```

### Page Visit Tracking

1. **Visitor Arrives**: `VisitorEmailTracker` component detects email
2. **Page Load**: Component calls `/api/email/track-visit`
3. **Record Updated**: Visit added to `visitedPages`, `visitCount++`
4. **Product View**: If product page, also tracked in `productViews`

### Automatic Integration

The system is **fully automatic**:
- ✅ Tracking pixel added to all emails
- ✅ All email links automatically tracked
- ✅ Page visits tracked automatically
- ✅ Product views tracked automatically

## 📈 Analytics Events

All tracking also creates `AnalyticsEvent` records:

- `email_open` - Email opened
- `email_click` - Link clicked in email
- `email_visit` - Page visited from email
- `product_view` - Product page viewed
- `page_view` - Any page viewed

## 🔍 Querying Tracking Data

### Get Email Open Rate

```javascript
const totalSent = await EmailTracking.countDocuments({ emailType: 'welcome' });
const totalOpened = await EmailTracking.countDocuments({ 
  emailType: 'welcome',
  opened: true 
});
const openRate = (totalOpened / totalSent) * 100;
```

### Get Click-Through Rate

```javascript
const totalOpened = await EmailTracking.countDocuments({ opened: true });
const totalClicked = await EmailTracking.countDocuments({ clicked: true });
const ctr = (totalClicked / totalOpened) * 100;
```

### Get Most Clicked Products

```javascript
const tracking = await EmailTracking.aggregate([
  { $unwind: '$clickedLinks' },
  { $match: { 'clickedLinks.linkType': 'product' } },
  { $group: {
    _id: '$clickedLinks.productId',
    clickCount: { $sum: 1 }
  }},
  { $sort: { clickCount: -1 } },
  { $limit: 10 }
]);
```

### Get Conversion Rate

```javascript
const totalSent = await EmailTracking.countDocuments();
const totalConverted = await EmailTracking.countDocuments({ converted: true });
const conversionRate = (totalConverted / totalSent) * 100;
```

### Get Subscriber Journey

```javascript
const journey = await EmailTracking.findOne({ email: 'user@example.com' })
  .sort({ emailSentAt: -1 });

console.log({
  emailSent: journey.emailSentAt,
  opened: journey.openedAt,
  clicked: journey.clickedAt,
  visited: journey.visitedAt,
  converted: journey.convertedAt,
  pagesVisited: journey.visitedPages.length,
  productsViewed: journey.productViews.length
});
```

## 📊 Admin Dashboard Queries

### Email Performance Summary

```javascript
const summary = await EmailTracking.aggregate([
  {
    $group: {
      _id: '$emailType',
      totalSent: { $sum: 1 },
      totalOpened: { $sum: { $cond: ['$opened', 1, 0] } },
      totalClicked: { $sum: { $cond: ['$clicked', 1, 0] } },
      totalVisited: { $sum: { $cond: ['$visited', 1, 0] } },
      totalConverted: { $sum: { $cond: ['$converted', 1, 0] } },
      avgOpenCount: { $avg: '$openCount' },
      avgClickCount: { $avg: '$clickCount' }
    }
  }
]);
```

### Top Performing Products (from emails)

```javascript
const topProducts = await EmailTracking.aggregate([
  { $unwind: '$productViews' },
  { $group: {
    _id: '$productViews.productId',
    views: { $sum: 1 },
    uniqueViewers: { $addToSet: '$email' }
  }},
  { $project: {
    productId: '$_id',
    totalViews: '$views',
    uniqueViewers: { $size: '$uniqueViewers' }
  }},
  { $sort: { totalViews: -1 } },
  { $limit: 20 }
]);
```

## 🎯 Use Cases

### 1. Identify Engaged Subscribers

```javascript
// Subscribers who opened AND clicked AND visited
const engaged = await EmailTracking.find({
  opened: true,
  clicked: true,
  visited: true,
  converted: false
}).sort({ emailSentAt: -1 });
```

### 2. Re-engage Non-Openers

```javascript
// Emails sent but never opened (after 48 hours)
const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
const nonOpeners = await EmailTracking.find({
  opened: false,
  emailSentAt: { $lt: twoDaysAgo }
});
```

### 3. Find High-Intent Visitors

```javascript
// Subscribers who viewed multiple products but didn't convert
const highIntent = await EmailTracking.find({
  'productViews.2': { $exists: true }, // Viewed 3+ products
  converted: false
});
```

### 4. Track Email-to-Purchase Journey

```javascript
const journey = await EmailTracking.findOne({ 
  email: 'user@example.com',
  converted: true 
});

// Time from email to purchase
const timeToConvert = journey.convertedAt - journey.emailSentAt;
```

## 🔔 Marking Conversions

When a subscriber makes a purchase, mark them as converted:

```javascript
// In your order completion handler
await EmailTracking.updateMany(
  { 
    email: customerEmail,
    converted: false 
  },
  {
    converted: true,
    convertedAt: new Date(),
    orderId: order._id.toString()
  }
);
```

## 📱 Real-Time Tracking

The system tracks in real-time:
- ✅ Opens tracked immediately when email loads
- ✅ Clicks tracked immediately when link clicked
- ✅ Visits tracked on every page load
- ✅ Product views tracked automatically

## 🛡️ Privacy & Compliance

- **Tracking Pixel**: Invisible, doesn't affect email appearance
- **No Personal Data**: Only tracks email and behavior
- **Opt-Out**: Respect unsubscribe requests
- **GDPR Compliant**: Can be extended with consent tracking

## 🚀 Next Steps

1. **View Tracking Data**: Query `EmailTracking` collection
2. **Build Dashboard**: Create admin panel with tracking metrics
3. **A/B Testing**: Compare email performance
4. **Automation**: Trigger actions based on tracking data
5. **Reporting**: Generate weekly/monthly reports

---

**Your email tracking system is fully operational! 📊**

