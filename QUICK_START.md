# 🚀 Quick Start Guide - Shopify-Like Features

Get your advanced e-commerce store running in 5 minutes!

## Step 1: Install Dependencies ✅

Dependencies are already installed! If you need to reinstall:

```bash
npm install
```

## Step 2: Run Database Migrations

Create the new database collections:

```bash
npm run migrate:auto
```

This will create:
- Discounts collection
- GiftCards collection
- LoyaltyAccounts collection
- AbandonedCarts collection
- FlashSales collection
- ProductBundles collection
- ProductRecommendations collection

## Step 3: Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Step 4: Test Features

### Test 1: Create a Discount Code

```bash
curl -X POST http://localhost:3000/api/discounts \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WELCOME20",
    "name": "Welcome Discount",
    "type": "percentage",
    "value": 20,
    "minPurchaseAmount": 0,
    "status": "active"
  }'
```

Then test it:
```bash
curl "http://localhost:3000/api/discounts?code=WELCOME20"
```

### Test 2: Create a Flash Sale

```bash
curl -X POST http://localhost:3000/api/flash-sales \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weekend Flash Sale",
    "startDate": "2025-11-11T00:00:00Z",
    "endDate": "2025-11-13T23:59:59Z",
    "products": [],
    "badgeText": "FLASH SALE",
    "showCountdown": true
  }'
```

### Test 3: Check Analytics

Visit: `http://localhost:3000/admin/analytics`

You should see:
- Total revenue
- Order count
- Customer stats
- Conversion rate
- Live indicator (red dot)

### Test 4: Test Real-Time Updates

Open two browser tabs:
1. Tab 1: `http://localhost:3000/admin/analytics`
2. Tab 2: Create an order

Watch Tab 1 update in real-time! 🔴 LIVE

## Step 5: Add Flash Sale Banner to Layout

Edit `src/app/layout.tsx`:

```typescript
import { FlashSaleBanner } from '@/components/FlashSaleBanner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <FlashSaleBanner />
        {/* existing layout */}
        {children}
      </body>
    </html>
  );
}
```

## Step 6: Update Product Cards

Replace old `ProductCard` with new one:

```typescript
import { ProductCard } from '@/components/ProductCard';

// In your product listing
products.map(product => (
  <ProductCard 
    key={product._id} 
    product={product}
    showQuickAdd
    animate
  />
))
```

## Step 7: Setup Cron Jobs (Optional but Recommended)

For abandoned cart recovery, set up a cron job:

### Option A: Vercel Cron (Free)

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/abandoned-carts/process",
    "schedule": "*/30 * * * *"
  }]
}
```

### Option B: External Cron Service

Use services like:
- cron-job.org (free)
- EasyCron (free tier)
- GitHub Actions (free)

Configure to hit:
```
POST https://yourdomain.com/api/abandoned-carts/process
```
Every 30 minutes

## Step 8: Configure Email (For Cart Recovery)

### Using Resend (Recommended - 3k emails/month free)

```bash
npm install resend
```

Add to `.env.local`:
```env
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@yourdomain.com
```

Or use existing Nodemailer setup - already configured!

## 🎯 Quick Feature Tests

### Test Loyalty Program

```bash
# Get or create loyalty account
curl "http://localhost:3000/api/loyalty?userId=test_user_123"

# Add points for purchase
curl -X POST http://localhost:3000/api/loyalty \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_123",
    "action": "purchase",
    "data": {
      "amount": 100,
      "orderId": "order_123"
    }
  }'
```

### Test Gift Card

```bash
# Create gift card
curl -X POST http://localhost:3000/api/gift-cards \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50,
    "recipientEmail": "customer@example.com",
    "senderName": "John Doe",
    "message": "Happy Birthday!"
  }'

# Check balance (use code from response)
curl "http://localhost:3000/api/gift-cards?code=XXXX-XXXX-XXXX-XXXX"
```

### Test Product Bundles

```bash
# Create bundle
curl -X POST http://localhost:3000/api/bundles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Essentials",
    "products": [
      {"productId": "prod_1", "quantity": 1},
      {"productId": "prod_2", "quantity": 1}
    ],
    "bundlePrice": 79.99,
    "slug": "summer-essentials"
  }'
```

## 🎨 UI Components Usage

### Use Countdown Timer

```typescript
import { Countdown } from '@/components/ui/countdown';

<Countdown 
  endDate={new Date('2025-12-31')}
  onComplete={() => console.log('Sale ended!')}
/>
```

### Use Progress Bar

```typescript
import { Progress } from '@/components/ui/progress';

<Progress value={75} max={100} animate showLabel />
```

### Use Badges

```typescript
import { Badge } from '@/components/ui/badge';

<Badge variant="success">New</Badge>
<Badge variant="destructive">-50%</Badge>
<Badge variant="warning">Low Stock</Badge>
```

## 🔥 Pro Tips

1. **Enable Real-Time Everywhere**
   ```typescript
   const { connected } = useRealtime('inventory');
   // Updates happen automatically!
   ```

2. **Show Live Order Notifications**
   ```typescript
   useRealtime('orders', (event) => {
     if (event.type === 'order_created') {
       toast.success('New order received!');
     }
   });
   ```

3. **Track Everything**
   - Discount usage is auto-tracked
   - Loyalty points auto-calculated
   - Analytics auto-updated
   - Cart abandonment auto-detected

4. **Optimize Performance**
   - Use `animate={false}` on mobile
   - Lazy load product images
   - Enable Next.js image optimization
   - Use MongoDB indexes (already added!)

## ✅ Checklist

- [x] Install dependencies
- [x] Run migrations
- [x] Start dev server
- [ ] Create test discount
- [ ] Create test flash sale
- [ ] View analytics dashboard
- [ ] Add FlashSaleBanner to layout
- [ ] Update ProductCard component
- [ ] Setup cron jobs
- [ ] Configure email service
- [ ] Test real-time updates

## 🎉 You're Ready!

Your store now has:
- ✅ Advanced discounts
- ✅ Gift cards
- ✅ Loyalty rewards
- ✅ Cart recovery
- ✅ Flash sales
- ✅ Real-time updates
- ✅ Beautiful UI
- ✅ Analytics dashboard

**All for $0/month!** 🚀

## 📚 Next Steps

1. Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for full feature list
2. Check [SHOPIFY_IMPLEMENTATION_PLAN.md](./SHOPIFY_IMPLEMENTATION_PLAN.md) for roadmap
3. Customize email templates
4. Brand your UI components
5. Add your products
6. Launch! 🚀

## 🆘 Need Help?

Common issues:

**"Discount not applying"**
- Check if discount is active
- Verify date range
- Check minimum purchase amount

**"Real-time not working"**
- Ensure EventSource is supported
- Check browser console for errors
- Verify endpoint is accessible

**"Flash sale not showing"**
- Create an active flash sale
- Ensure dates are correct
- Add FlashSaleBanner to layout

**Still stuck?** Check the implementation files or create an issue!

---

**Happy selling!** 🛍️✨

