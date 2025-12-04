# Abandoned Cart Testing Guide

Quick reference guide for testing abandoned cart functionality.

## Prerequisites

- MongoDB running and connected
- Test products, user account, and admin credentials
- Browser DevTools (F12) and API testing tool (Postman/curl)

## Quick Tests

### 1. Cart Tracking (Authenticated User)
1. Login → Add items to cart → Visit `/cart`
2. Wait 2-3 seconds (auto-tracks after 2s)
3. Check console: Should see POST to `/api/cart/abandonment`
4. Verify DB: `db.cartabandonments.find().sort({ createdAt: -1 }).limit(1)`
   - Should have: `userId`, `userEmail`, `items`, `recovered: false`

### 2. Cart Tracking (Guest User)
1. Open incognito window → Add items → Visit `/cart`
2. Check Session Storage: Should have `sessionId`
3. Verify DB: Record should have `sessionId` (no `userId`)

### 3. View Abandoned Carts API
```bash
# Authenticated
curl -X GET "http://localhost:3000/api/cart/abandonment" \
  -H "Authorization: Bearer YOUR_TOKEN"

# By email
curl -X GET "http://localhost:3000/api/cart/abandonment?email=test@example.com"
```
Expected: JSON with `abandonments` array (only `recovered: false`)

### 4. Send Recovery Email (Single)
```bash
curl -X POST "http://localhost:3000/api/cart/abandonment/send-recovery" \
  -H "Content-Type: application/json" \
  -d '{"abandonmentId": "YOUR_ID"}'
```
Check: Email received, DB `emailSent: true`, `emailSentAt` set

### 5. Send Recovery Email (Batch)
```bash
curl -X POST "http://localhost:3000/api/cart/abandonment/send-recovery" \
  -H "Content-Type: application/json" \
  -d '{"hoursSinceAbandonment": 1}'
```
Processes all carts abandoned 1+ hours ago (max 50 per batch)

### 6. Cron Job
```bash
# Without secret
curl -X GET "http://localhost:3000/api/cron/cart-abandonment"

# With secret (if CRON_SECRET set)
curl -X GET "http://localhost:3000/api/cron/cart-abandonment" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```
Should return: `{"success": true, "results": {...}}`

### 7. Admin Analytics
```bash
# Calculate analytics
curl -X POST "http://localhost:3000/api/admin/analytics/abandoned-carts" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date": "2024-01-15"}'

# Get analytics
curl -X GET "http://localhost:3000/api/admin/analytics/abandoned-carts?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```
Returns: Total carts, recovery rate, top products, email metrics

## Database Verification

```javascript
// Find latest abandonment
db.cartabandonments.find().sort({ createdAt: -1 }).limit(1).pretty()

// Check by user email
db.cartabandonments.find({ userEmail: "test@example.com", recovered: false })

// Count abandoned carts today
db.cartabandonments.countDocuments({ 
  createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) },
  recovered: false 
})

// Set timestamp back for testing (2 hours ago)
db.cartabandonments.updateMany(
  { recovered: false, emailSent: false },
  { $set: { lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000) } }
)

// Manually mark as recovered
db.cartabandonments.updateOne(
  { _id: ObjectId("YOUR_ID") },
  { $set: { recovered: true, recoveredAt: new Date() } }
)
```

## API Endpoints Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/cart/abandonment` | POST | Optional | Track/create abandonment |
| `/api/cart/abandonment` | GET | Optional* | Get abandonments |
| `/api/cart/abandonment/send-recovery` | POST | None | Send recovery email(s) |
| `/api/cron/cart-abandonment` | GET | CRON_SECRET* | Cron job endpoint |
| `/api/admin/analytics/abandoned-carts` | GET | Admin | Get analytics |
| `/api/admin/analytics/abandoned-carts` | POST | Admin | Calculate analytics |

*Required for user-specific queries

## Key Features

✅ **Auto-tracking**: Tracks after 2 seconds on cart page  
✅ **Works for guests**: Uses sessionId for non-authenticated users  
✅ **Email recovery**: Send single or batch recovery emails  
✅ **Analytics**: Complete metrics dashboard  
✅ **Cron job**: Automated email sending  

## Known Issues

⚠️ **Missing**: Carts are NOT automatically marked as "recovered" when orders are placed.  
**Impact**: Recovery rate may be inaccurate unless manually updated.

**Recommended Fix**: Add to order creation API:
```typescript
await CartAbandonment.updateMany(
  {
    userId: userId || undefined,
    userEmail: orderData.shippingAddress?.email || orderData.guestEmail,
    recovered: false
  },
  {
    $set: { recovered: true, recoveredAt: new Date() }
  }
);
```

## Quick Checklist

- [ ] Cart tracks automatically (auth + guest)
- [ ] API endpoints work correctly
- [ ] Recovery emails send successfully
- [ ] Batch email processing works
- [ ] Cron job endpoint accessible
- [ ] Analytics calculate correctly
- [ ] Database queries return expected data
- [ ] Edge cases handled (empty cart, rapid changes, etc.)

## Troubleshooting

**Not tracking?** → Check console errors, verify API accessible, ensure cart has items  
**Emails not sending?** → Check email service config, verify `userEmail` exists  
**Analytics wrong?** → Verify admin auth, check date format, ensure data exists  
**Cron not working?** → Verify CRON_SECRET matches, check endpoint accessibility  

## Test Data Setup

```javascript
// Create test abandonment with old timestamp (for testing batch emails)
db.cartabandonments.insertOne({
  userId: "test_user_id",
  userEmail: "test@example.com",
  items: [
    {
      productId: "product1",
      productName: "Test Product",
      quantity: 2,
      price: 29.99,
      image: "https://example.com/image.jpg"
    }
  ],
  subtotal: 59.98,
  total: 64.78,
  lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  emailSent: false,
  recovered: false,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

**Quick Test Flow**: Login → Add to cart → Visit cart → Check DB → Send email → Verify analytics
