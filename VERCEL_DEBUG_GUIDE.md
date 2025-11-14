# Vercel Deployment Debug Guide

## 🎉 Changes Made

### 1. **Removed `NEXT_PUBLIC_API_URL` Dependency**
All store files now use **relative paths** (`/api/products`) instead of requiring `NEXT_PUBLIC_API_URL`.

**Files Updated:**
- ✅ `src/store/productStore.ts`
- ✅ `src/store/authStore.ts`
- ✅ `src/store/orderStore.ts`
- ✅ `src/store/wishlistStore.ts`
- ✅ `src/store/paymentStore.ts`

**Result:** API calls will work without setting `NEXT_PUBLIC_API_URL` since frontend and backend are on the same Vercel domain.

---

### 2. **Added Comprehensive Logging**

#### MongoDB Connection (`src/lib/mongodb.ts`)
- ✅ Logs environment variable status on startup
- ✅ Logs connection attempts with detailed error messages
- ✅ Shows database name and host on successful connection
- ✅ Displays error codes, messages, and stack traces on failure

#### API Routes
- ✅ `src/app/api/products/route.ts` - Full request/response logging
- ✅ `src/app/api/categories/counts/route.ts` - Aggregation logging

#### Store Files (Client-side)
- ✅ All store files log API calls with request details
- ✅ Error responses are logged to browser console

---

### 3. **CORS Configuration**
✅ **Not needed!** Since your frontend and API are on the same Vercel domain, CORS is automatically handled by Next.js.

---

## 📋 Required Vercel Environment Variables

### **Minimum Required (3 variables):**

```env
# Database Connection (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce-store?retryWrites=true&w=majority

# Authentication (REQUIRED)
JWT_SECRET=your-super-secret-key-at-least-32-characters-long

# SEO & Social Sharing (REQUIRED)
NEXT_PUBLIC_SITE_URL=https://ecommerce-store-g6kgzyz27-testleadz04s-projects.vercel.app
```

### **Optional (for full functionality):**

```env
# Email (for order confirmations)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=noreply@yourdomain.com

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🔍 How to Debug in Vercel

### **Step 1: Check Environment Variables**
Visit: `https://your-vercel-url.vercel.app/api/test-stripe`

This will show which environment variables are set (true/false).

### **Step 2: Test API Directly**
Visit: `https://your-vercel-url.vercel.app/api/products`

**Expected responses:**
- ✅ `{"products": [], ...}` - API works, database is empty (need to seed)
- ❌ `{"error": "Internal server error"}` - Check logs for MongoDB connection error

### **Step 3: View Logs in Vercel Dashboard**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **"Deployments"**
4. Click on latest deployment
5. Click **"Functions"** tab
6. Click on any API route (e.g., `api/products`)
7. View **"Real-time Logs"**

**Look for these log messages:**

✅ **Success:**
```
[MongoDB] Environment check: { hasMongoURI: true, ... }
[MongoDB] Initiating new connection...
[MongoDB] Connected successfully!
[API /products] GET request received
[API /products] Success - Returning 0 products
```

❌ **MongoDB Connection Failed:**
```
[MongoDB] Connection failed!
[MongoDB] Error message: connection timed out
```
**Fix:** Check MongoDB Atlas → Network Access → Add `0.0.0.0/0`

❌ **Missing Environment Variable:**
```
[MongoDB] Environment check: { hasMongoURI: false }
```
**Fix:** Add `MONGODB_URI` to Vercel environment variables and redeploy

---

## 🚀 Deployment Checklist

### **Before Deploying:**
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] Network Access: `0.0.0.0/0` (allow all IPs)
- [ ] Connection string copied

### **In Vercel Dashboard:**
1. Go to **Settings** → **Environment Variables**
2. Add these variables:
   - [ ] `MONGODB_URI`
   - [ ] `JWT_SECRET`
   - [ ] `NEXT_PUBLIC_SITE_URL`
3. Check boxes: **Production**, **Preview**, **Development**
4. Click **"Save"**

### **Deploy:**
5. Go to **Deployments** tab
6. Click latest deployment → **"..."** → **"Redeploy"**
7. **Uncheck** "Use existing Build Cache"
8. Click **"Redeploy"**

### **After Deployment:**
9. Visit `/api/test-stripe` - Check all values are `true`
10. Visit `/api/products` - Should return JSON (might be empty)
11. Check **Functions** → **Logs** for any MongoDB errors
12. If empty, seed database (see below)

---

## 🌱 Seeding Your Database

### **Option 1: API Endpoint (Recommended)**
```bash
curl -X POST https://your-vercel-url.vercel.app/api/seed
```

### **Option 2: Local Script**
```bash
# In .env.local, set your MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://...

# Run seed script
node scripts/seed-database.js
```

---

## 🐛 Common Issues & Solutions

### **Issue 1: "Failed to fetch" errors**
**Cause:** Environment variables not set or not redeployed after setting them.

**Solution:**
1. Verify variables are in Vercel
2. Redeploy (without cache)

### **Issue 2: "Connection timed out"**
**Cause:** MongoDB Atlas IP whitelist doesn't include Vercel IPs.

**Solution:**
1. MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (allow all)
3. Wait 2 minutes
4. Test again

### **Issue 3: "No products found"**
**Cause:** Database is empty.

**Solution:**
- Seed the database using API endpoint or script

### **Issue 4: Logs show "MONGODB_URI is not defined"**
**Cause:** Environment variable not set in Vercel.

**Solution:**
1. Double-check Vercel environment variables
2. Make sure checkboxes are selected (Production, Preview, Development)
3. Redeploy

---

## 📊 What You'll See in Logs (Success)

```
[MongoDB] Environment check: {
  hasMongoURI: true,
  isBuildTime: false,
  nodeEnv: 'production',
  mongoURIPrefix: 'mongodb+srv://...'
}
[MongoDB] Initiating new connection...
[MongoDB] Connection URI prefix: mongodb+srv://username:***...
[MongoDB] Connected successfully!
[MongoDB] Database: ecommerce-store
[MongoDB] Host: cluster0.mongodb.net
[MongoDB] Connection established and cached

[API /products] GET request received
[API /products] Connecting to database...
[API /products] Database connected successfully
[API /products] Search params: 
[API /products] Executing query: {"isActive":true,...}
[API /products] Found 25 products (before deduplication)
[API /products] After deduplication: 25 products
[API /products] Total count: 25
[API /products] Success - Returning 25 products
```

---

## 🎯 Next Steps

1. **Set environment variables in Vercel** (3 required: `MONGODB_URI`, `JWT_SECRET`, `NEXT_PUBLIC_SITE_URL`)
2. **Redeploy without cache**
3. **Check logs** in Vercel dashboard
4. **Test** `/api/test-stripe` and `/api/products`
5. **Seed database** if empty
6. **Visit** `/products` page - should work! 🎉

---

## 📞 Still Having Issues?

Check the Vercel Function logs:
- Go to: Vercel Dashboard → Your Project → Deployments → Latest → Functions
- Click on any failing API route
- View Real-time Logs
- Look for the `[MongoDB]` and `[API]` prefixed messages
- The detailed error messages will tell you exactly what's wrong

All logs now include emojis for easy scanning:
- ✅ = Success
- ❌ = Error
- ⏳ = In Progress  
- ⚠️ = Warning
- 🔄 = Processing

