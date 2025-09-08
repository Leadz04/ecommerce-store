# Phase 1 Verification Checklist

## Step 1: Environment Variables Check
Verify your `.env.local` file has all required variables:

```bash
# Check if .env.local exists and has all variables
cat .env.local
```

Required variables:
- [ ] MONGODB_URI
- [ ] JWT_SECRET
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_PUBLISHABLE_KEY
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] NEXT_PUBLIC_API_URL

## Step 2: Install Dependencies
```bash
npm install
```

## Step 3: Start Development Server
```bash
npm run dev
```

## Step 4: Test Database Connection
1. Open browser to `http://localhost:3000`
2. Check browser console for any MongoDB connection errors
3. Look for "Connected to MongoDB" in server logs

## Step 5: Seed Database
```bash
# Option 1: Use API endpoint
curl -X POST http://localhost:3000/api/seed

# Option 2: Check if products load on /products page
```

## Step 6: Test Authentication
1. Go to `/signup` page
2. Create a new account
3. Check if you can login at `/login`
4. Verify user data persists after page refresh

## Step 7: Test Products API
1. Go to `/products` page
2. Verify products load from database (not mock data)
3. Test search functionality
4. Test category filtering
5. Test pagination

## Step 8: Test Product Details
1. Click on any product
2. Verify product details load from database
3. Test "Add to Cart" functionality

## Step 9: Test Cart & Checkout
1. Add items to cart
2. Go to checkout page
3. Fill out checkout form
4. Test payment flow (use Stripe test card: 4242 4242 4242 4242)

## Step 10: Test Stripe Webhook (Optional for Development)
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/payments/webhook`
4. Copy webhook secret to .env.local
5. Test payment - verify order status updates

## Common Issues & Solutions

### MongoDB Connection Error
- Check connection string format
- Verify IP whitelist in MongoDB Atlas
- Check database user permissions

### JWT Token Error
- Ensure JWT_SECRET is set and strong
- Check token expiration

### Stripe Payment Error
- Verify API keys are correct
- Check if using test keys (sk_test_...)
- Ensure webhook endpoint is accessible

### Products Not Loading
- Check if database was seeded
- Verify API endpoints are working
- Check browser console for errors
