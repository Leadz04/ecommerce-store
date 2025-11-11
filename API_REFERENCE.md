# 📚 API Reference - E-Commerce Store

## Authentication

Most admin endpoints require authentication. Include JWT token in headers:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 💸 Discounts API

### Create Discount
```http
POST /api/discounts
Content-Type: application/json

{
  "code": "SUMMER20",
  "name": "Summer Sale",
  "type": "percentage",
  "value": 20,
  "minPurchaseAmount": 50,
  "maxDiscountAmount": 100,
  "usageLimit": 1000,
  "usageLimitPerCustomer": 1,
  "startDate": "2025-06-01T00:00:00Z",
  "endDate": "2025-08-31T23:59:59Z",
  "status": "active"
}
```

**Response**: `{ discount: { _id, code, name, ... } }`

### Validate Discount
```http
GET /api/discounts?code=SUMMER20
```

**Response**: `{ discount: {...}, isValid: true }`

### List Discounts
```http
GET /api/discounts?status=active
```

### Apply Discount to Cart
```http
POST /api/discounts/apply
Content-Type: application/json

{
  "code": "SUMMER20",
  "orderTotal": 150,
  "items": [...],
  "userId": "user_123",
  "quantity": 2
}
```

**Response**: 
```json
{
  "success": true,
  "discount": {...},
  "discountAmount": 30,
  "originalTotal": 150,
  "finalTotal": 120,
  "savings": 30
}
```

### Update Discount
```http
PUT /api/discounts
Content-Type: application/json

{
  "id": "discount_id",
  "isActive": false
}
```

### Delete Discount
```http
DELETE /api/discounts?id=discount_id
```

---

## 🎁 Gift Cards API

### Create Gift Card
```http
POST /api/gift-cards
Content-Type: application/json

{
  "amount": 100,
  "currency": "USD",
  "recipientEmail": "customer@example.com",
  "recipientName": "Jane Doe",
  "senderName": "John Doe",
  "message": "Happy Birthday!",
  "scheduledSendDate": "2025-12-25T00:00:00Z",
  "userId": "user_123"
}
```

**Response**: 
```json
{
  "giftCard": {
    "_id": "...",
    "code": "ABCD-EFGH-IJKL-MNOP",
    "initialBalance": 100,
    "currentBalance": 100,
    "status": "active"
  }
}
```

### Check Gift Card Balance
```http
GET /api/gift-cards?code=ABCD-EFGH-IJKL-MNOP
```

**Response**:
```json
{
  "giftCard": {
    "code": "ABCD-EFGH-IJKL-MNOP",
    "currentBalance": 75.50,
    "currency": "USD",
    "status": "active",
    "isValid": true
  }
}
```

### Apply Gift Card to Order
```http
POST /api/gift-cards/apply
Content-Type: application/json

{
  "code": "ABCD-EFGH-IJKL-MNOP",
  "amount": 50,
  "orderId": "order_123",
  "userId": "user_123"
}
```

**Response**:
```json
{
  "success": true,
  "appliedAmount": 50,
  "remainingBalance": 25.50,
  "giftCardId": "..."
}
```

### Get User's Gift Cards
```http
GET /api/gift-cards?userId=user_123
```

---

## 🏆 Loyalty Program API

### Get or Create Loyalty Account
```http
GET /api/loyalty?userId=user_123
```

**Response**:
```json
{
  "loyaltyAccount": {
    "userId": "user_123",
    "points": 1500,
    "tier": "silver",
    "lifetimePoints": 1500,
    "lifetimeSpent": 1500,
    "discountPercentage": 5,
    "freeShipping": false,
    "referralCode": "JOHN123",
    "nextTierPoints": 3500
  }
}
```

### Add Points (Purchase)
```http
POST /api/loyalty
Content-Type: application/json

{
  "userId": "user_123",
  "action": "purchase",
  "data": {
    "amount": 100,
    "orderId": "order_123"
  }
}
```

### Add Points (Review)
```http
POST /api/loyalty
Content-Type: application/json

{
  "userId": "user_123",
  "action": "review",
  "data": {
    "productId": "prod_123"
  }
}
```

### Add Points (Referral)
```http
POST /api/loyalty
Content-Type: application/json

{
  "userId": "user_123",
  "action": "referral",
  "data": {
    "referredUserId": "user_456",
    "referredEmail": "friend@example.com"
  }
}
```

### Redeem Points
```http
POST /api/loyalty
Content-Type: application/json

{
  "userId": "user_123",
  "action": "redeem",
  "data": {
    "points": 500,
    "reason": "Discount redemption",
    "orderId": "order_123"
  }
}
```

### Birthday Bonus
```http
POST /api/loyalty
Content-Type: application/json

{
  "userId": "user_123",
  "action": "birthday"
}
```

---

## 🛒 Abandoned Carts API

### Track Cart
```http
POST /api/abandoned-carts
Content-Type: application/json

{
  "sessionId": "session_xyz",
  "userId": "user_123",
  "email": "customer@example.com",
  "customerName": "John Doe",
  "items": [
    {
      "productId": "prod_1",
      "productName": "Product 1",
      "productImage": "image.jpg",
      "quantity": 2,
      "price": 50,
      "total": 100
    }
  ],
  "subtotal": 100,
  "total": 100,
  "itemCount": 2
}
```

### List Abandoned Carts
```http
GET /api/abandoned-carts?status=abandoned&userId=user_123
```

### Process Abandoned Carts (Cron Job)
```http
POST /api/abandoned-carts/process
```

**Response**:
```json
{
  "success": true,
  "markedAbandoned": 5,
  "oneHourSent": 3,
  "twentyFourHourSent": 2,
  "threeDaySent": 1,
  "expired": 4
}
```

---

## ⚡ Flash Sales API

### Create Flash Sale
```http
POST /api/flash-sales
Content-Type: application/json

{
  "name": "Black Friday Sale",
  "description": "Biggest sale of the year!",
  "startDate": "2025-11-29T00:00:00Z",
  "endDate": "2025-11-29T23:59:59Z",
  "products": [
    {
      "productId": "prod_1",
      "originalPrice": 100,
      "salePrice": 70,
      "discountPercentage": 30,
      "quantityLimit": 50
    }
  ],
  "globalQuantityLimit": 500,
  "limitPerCustomer": 5,
  "badgeText": "FLASH SALE",
  "showCountdown": true,
  "highlightOnHomepage": true,
  "notifySubscribers": true
}
```

### List Flash Sales
```http
GET /api/flash-sales?status=active
```

### Get Active Flash Sale
```http
GET /api/flash-sales/active
```

**Response**:
```json
{
  "flashSale": {
    "_id": "...",
    "name": "Black Friday Sale",
    "endDate": "2025-11-29T23:59:59Z",
    "products": [...],
    "badgeText": "FLASH SALE",
    "showCountdown": true
  }
}
```

### Update Flash Sale
```http
PUT /api/flash-sales
Content-Type: application/json

{
  "id": "flashsale_id",
  "status": "cancelled"
}
```

---

## 📦 Product Bundles API

### Create Bundle
```http
POST /api/bundles
Content-Type: application/json

{
  "name": "Summer Essentials",
  "slug": "summer-essentials",
  "description": "Everything you need for summer",
  "products": [
    {
      "productId": "prod_1",
      "quantity": 1,
      "canCustomize": true
    },
    {
      "productId": "prod_2",
      "quantity": 1,
      "canCustomize": false
    }
  ],
  "originalPrice": 150,
  "bundlePrice": 120,
  "images": ["image1.jpg"],
  "featured": true,
  "category": "Summer"
}
```

### List Bundles
```http
GET /api/bundles?featured=true&category=Summer&limit=10
```

### Update Bundle
```http
PUT /api/bundles
Content-Type: application/json

{
  "id": "bundle_id",
  "bundlePrice": 110,
  "featured": false
}
```

---

## 🎯 Product Recommendations API

### Get Recommendations
```http
GET /api/recommendations/prod_123?type=related&limit=5
```

**Types**:
- `related` - Similar products
- `frequently_bought` - Often bought together
- `similar` - Similar attributes
- `upsell` - Higher-priced alternatives
- `cross_sell` - Complementary products

**Response**:
```json
{
  "recommendations": [
    {
      "productId": {
        "_id": "prod_2",
        "name": "Product 2",
        "price": 50,
        "images": [...]
      },
      "score": 95,
      "reason": "Similar category or tags"
    }
  ]
}
```

### Track Recommendation Click
```http
POST /api/recommendations/prod_123
Content-Type: application/json

{
  "type": "related",
  "clickedProductId": "prod_2",
  "converted": true
}
```

---

## 📊 Analytics API

### Get Overview Stats
```http
GET /api/admin/analytics
```

**Response**:
```json
{
  "totalRevenue": 50000,
  "totalOrders": 250,
  "totalCustomers": 150,
  "avgOrderValue": 200,
  "revenueChange": 15.5,
  "ordersChange": 10.2,
  "customersChange": 8.5,
  "avgOrderChange": 5.5,
  "conversionRate": 2.5,
  "newCustomersThisMonth": 25,
  "period": {
    "start": "2025-11-01T00:00:00Z",
    "end": "2025-11-11T12:00:00Z"
  }
}
```

### Get Top Products
```http
GET /api/admin/analytics/top-products?period=month&limit=10
```

**Periods**: `month`, `week`, `all`

**Response**:
```json
{
  "products": [
    {
      "_id": "prod_1",
      "name": "Product 1",
      "salesCount": 50,
      "revenue": 2500,
      "imageUrl": "image.jpg"
    }
  ]
}
```

---

## 🔴 Real-Time API

### Subscribe to Events
```http
GET /api/realtime/orders
Accept: text/event-stream
```

**Channels**:
- `orders` - Order events
- `inventory` - Inventory updates
- `admin` - Admin notifications
- `flash-sales` - Flash sale updates

**Event Format**:
```json
{
  "type": "order_created",
  "data": {
    "orderId": "order_123",
    "total": 150
  },
  "timestamp": 1699876543210
}
```

**Event Types**:
- `order_created` - New order
- `order_updated` - Order status changed
- `inventory_update` - Stock changed
- `flash_sale_update` - Sale status changed
- `low_stock_alert` - Product low on stock

---

## 📦 Orders API (Enhanced)

### List Orders
```http
GET /api/admin/orders?limit=10&sort=createdAt:desc&status=processing
```

**Statuses**: `pending`, `processing`, `shipped`, `delivered`, `completed`, `cancelled`

---

## 🔐 Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "JWT_TOKEN",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "customer"
  }
}
```

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer JWT_TOKEN
```

---

## 📊 Rate Limits

| Endpoint | Limit |
|----------|-------|
| Public APIs | 100 req/min |
| Authenticated | 500 req/min |
| Admin APIs | 1000 req/min |
| Real-time SSE | No limit |

---

## 🔧 Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "detail": {...}
}
```

**HTTP Status Codes**:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🚀 Tips for API Usage

1. **Idempotency**: Use the same request ID for retries
2. **Pagination**: Use `limit` and `skip` parameters
3. **Filtering**: Most list endpoints support query filters
4. **Real-Time**: Use SSE for live updates instead of polling
5. **Caching**: Cache discount validations for better performance

---

## 📚 SDK (Coming Soon)

JavaScript/TypeScript SDK for easier integration:

```typescript
import { EcommerceClient } from '@your-store/sdk';

const client = new EcommerceClient({ apiKey: 'xxx' });

// Create discount
const discount = await client.discounts.create({
  code: 'SAVE20',
  type: 'percentage',
  value: 20
});

// Subscribe to events
client.realtime.subscribe('orders', (event) => {
  console.log('New order:', event.data);
});
```

---

**Need help?** Check [QUICK_START.md](./QUICK_START.md) or [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

