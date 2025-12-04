# Admin Analytics Dashboard Guide

Complete guide on how to view users and analytics for all functionalities on your admin page.

## Accessing the Admin Dashboard

1. **Navigate to Admin Page**:
   - URL: `http://localhost:3000/admin`
   - Or: Go to `/admin` from your site

2. **Login Required**:
   - You must be logged in as a **SUPER_ADMIN** user
   - Regular users won't see the admin dashboard

3. **Available Tabs**:
   - Overview
   - Analytics ← **Main analytics tab**
   - Users
   - Products
   - Orders
   - Marketing
   - Performance
   - And more...

---

## Current Analytics Features

### What's Currently Displayed

The **Analytics Tab** (`/admin?tab=analytics`) currently shows:

1. **Funnel Analytics** - Conversion funnel data
2. **Search Analytics** - Search query statistics
3. **Cohort Analytics** - Customer cohort analysis

### What's Available but NOT Yet Displayed in UI

The following analytics APIs exist but need to be added to the admin UI:

1. ✅ **Abandoned Cart Analytics** - API exists
2. ✅ **Customer Analytics** - API exists
3. ✅ **Purchase Analytics** - API exists

---

## How to View Analytics (Current Methods)

### Method 1: Using API Endpoints Directly

You can access analytics data directly via API calls:

#### Abandoned Cart Analytics

**Get Analytics**:
```bash
# In browser console or using curl
const token = localStorage.getItem('token');
const response = await fetch('/api/admin/analytics/abandoned-carts?startDate=2024-01-01&endDate=2024-01-31', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log(data);
```

**Calculate Analytics for a Date**:
```bash
const token = localStorage.getItem('token');
const response = await fetch('/api/admin/analytics/abandoned-carts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ date: '2024-01-15' })
});
const data = await response.json();
console.log(data);
```

#### Customer Analytics

```bash
const token = localStorage.getItem('token');
const response = await fetch('/api/admin/analytics/customers?limit=50', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log(data);
```

#### Purchase Analytics

```bash
const token = localStorage.getItem('token');
const response = await fetch('/api/admin/analytics/purchases?startDate=2024-01-01&endDate=2024-01-31', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log(data);
```

### Method 2: View Raw Data in Database

Use MongoDB Compass or mongosh to query directly:

```javascript
// Abandoned Cart Analytics
db.abandonedcartanalytics.find().sort({ date: -1 }).limit(10).pretty()

// Individual Abandoned Carts
db.cartabandonments.find().sort({ createdAt: -1 }).limit(10).pretty()

// Customer Analytics
db.customeranalytics.find().sort({ totalSpent: -1 }).limit(10).pretty()

// Purchase Analytics
db.purchaseanalytics.find().sort({ date: -1 }).limit(10).pretty()
```

### Method 3: Browser Console Helper

Add this to your browser console on the admin page:

```javascript
// Helper function to fetch analytics
async function getAnalytics(type, params = {}) {
  const token = localStorage.getItem('token');
  const queryParams = new URLSearchParams(params).toString();
  const url = `/api/admin/analytics/${type}${queryParams ? '?' + queryParams : ''}`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch');
  }
  
  return await response.json();
}

// Usage examples:
getAnalytics('abandoned-carts', { startDate: '2024-01-01', endDate: '2024-01-31' }).then(console.log);
getAnalytics('customers', { limit: 10 }).then(console.log);
getAnalytics('purchases', { startDate: '2024-01-01' }).then(console.log);
```

---

## Available Analytics Data

### 1. Abandoned Cart Analytics

**Endpoint**: `/api/admin/analytics/abandoned-carts`

**Data Includes**:
- Total abandoned carts
- Total cart value
- Average cart value
- Unique users who abandoned
- Recovery rate (% of carts recovered)
- Recovered carts count and value
- Time to abandonment (average & median in minutes)
- Top abandoned products
- Email performance:
  - Emails sent count
  - Email open rate
  - Email click rate
  - Email conversion rate

**Example Response**:
```json
{
  "analytics": [{
    "date": "2024-01-15T00:00:00.000Z",
    "totalAbandonedCarts": 25,
    "totalCartValue": 2499.50,
    "averageCartValue": 99.98,
    "uniqueUsers": 20,
    "recoveryRate": 12.5,
    "recoveredCarts": 3,
    "recoveredValue": 299.97,
    "timeToAbandonment": {
      "average": 45.5,
      "median": 42.0
    },
    "topAbandonedProducts": [
      {
        "productId": "...",
        "productName": "Product Name",
        "abandonmentCount": 5,
        "totalValue": 499.95
      }
    ],
    "emailOpenRate": 62.5,
    "emailClickRate": 37.5,
    "emailConversionRate": 25.0
  }]
}
```

### 2. Customer Analytics

**Endpoint**: `/api/admin/analytics/customers`

**Data Includes**:
- Customer lifetime value
- Total spent
- Order count
- Average order value
- Customer segment (new, regular, VIP, at-risk)
- Favorite products
- Favorite categories
- Cart abandonment rate
- Last order date
- First order date

**Query Parameters**:
- `userId` - Get analytics for specific user
- `segment` - Filter by customer segment
- `limit` - Number of results (default: 50)

### 3. Purchase Analytics

**Endpoint**: `/api/admin/analytics/purchases`

**Data Includes**:
- Daily revenue totals
- Order counts
- Average order value
- Items sold
- Unique customers
- New vs returning customers
- Top products by revenue
- Top categories by revenue
- Payment method breakdown
- Conversion rates

---

## Viewing Abandoned Carts (Individual Records)

### Get All Abandoned Carts

**Via API**:
```bash
# Get your own abandoned carts (if logged in)
GET /api/cart/abandonment
Authorization: Bearer YOUR_TOKEN

# Get by email (for admin testing)
GET /api/cart/abandonment?email=user@example.com
```

**Via Database**:
```javascript
// All abandoned carts
db.cartabandonments.find().sort({ createdAt: -1 }).limit(20).pretty()

// Non-recovered carts only
db.cartabandonments.find({ recovered: false }).sort({ createdAt: -1 })

// Carts waiting for recovery email
db.cartabandonments.find({
  recovered: false,
  emailSent: false,
  userEmail: { $exists: true, $ne: null }
}).sort({ lastActivityAt: 1 })

// By user email
db.cartabandonments.find({ userEmail: "test@example.com" })
```

---

## Quick Access URLs

### Direct Admin Page Links

1. **Admin Overview**: `http://localhost:3000/admin?tab=overview`
2. **Analytics Tab**: `http://localhost:3000/admin?tab=analytics`
3. **Users Tab**: `http://localhost:3000/admin?tab=users`
4. **Orders Tab**: `http://localhost:3000/admin?tab=orders`

### API Endpoints (Use in browser console or Postman)

- **Abandoned Cart Analytics**: `/api/admin/analytics/abandoned-carts`
- **Customer Analytics**: `/api/admin/analytics/customers`
- **Purchase Analytics**: `/api/admin/analytics/purchases`
- **General Analytics**: `/api/admin/analytics`

---

## Recommended: Add UI Components

Since the analytics APIs exist but aren't displayed in the UI, here's what you can do:

### Option 1: Quick Browser Bookmarklet

Create a bookmark with this JavaScript:

```javascript
javascript:(function(){
  const token = localStorage.getItem('token');
  if(!token) { alert('Not logged in!'); return; }
  
  const type = prompt('Analytics type:\n1=abandoned-carts\n2=customers\n3=purchases', '1');
  const types = { '1': 'abandoned-carts', '2': 'customers', '3': 'purchases' };
  
  fetch(`/api/admin/analytics/${types[type]}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(r => r.json())
  .then(data => {
    const win = window.open('', '_blank');
    win.document.write('<pre>' + JSON.stringify(data, null, 2) + '</pre>');
  });
})();
```

### Option 2: Use Postman Collection

1. Create a Postman collection
2. Add requests for each analytics endpoint
3. Use the admin token from localStorage
4. Save and run queries easily

### Option 3: Create a Simple HTML Page

Create `admin-analytics-viewer.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Admin Analytics Viewer</title>
  <style>
    body { font-family: monospace; padding: 20px; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; }
    button { margin: 10px 5px; padding: 10px 20px; }
  </style>
</head>
<body>
  <h1>Admin Analytics Viewer</h1>
  <button onclick="loadAnalytics('abandoned-carts')">Abandoned Carts</button>
  <button onclick="loadAnalytics('customers')">Customers</button>
  <button onclick="loadAnalytics('purchases')">Purchases</button>
  
  <div id="result"></div>
  
  <script>
    async function loadAnalytics(type) {
      const token = prompt('Enter admin token (from localStorage.token):');
      if (!token) return;
      
      const response = await fetch(`http://localhost:3000/api/admin/analytics/${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      document.getElementById('result').innerHTML = 
        '<h2>' + type + '</h2><pre>' + JSON.stringify(data, null, 2) + '</pre>';
    }
  </script>
</body>
</html>
```

---

## Summary

### ✅ Currently Available
- Analytics APIs are working
- Data is being collected and stored
- Accessible via API calls
- Viewable in database

### ⚠️ Not Yet in UI
- Abandoned Cart Analytics dashboard component
- Customer Analytics dashboard component  
- Purchase Analytics dashboard component

### 📝 Next Steps

1. **Quick Access**: Use API endpoints directly (Method 1 above)
2. **Database View**: Query MongoDB directly (Method 2)
3. **Future Enhancement**: Add UI components to admin dashboard to display these analytics visually

---

## Troubleshooting

### Getting 403 Forbidden
- Make sure you're logged in as SUPER_ADMIN
- Check that your token is valid
- Verify role permissions

### No Data Returned
- Check if analytics have been calculated (POST endpoint)
- Verify date ranges are correct
- Check database for existing records

### Data Not Updating
- Run the POST endpoint to calculate analytics for a specific date
- Check cron jobs are running
- Verify data is being collected

---

**Quick Tip**: Open browser console on admin page and use the helper functions above for quick analytics access!

