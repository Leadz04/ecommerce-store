# 🚀 Vercel Deployment Guide

Complete guide to deploying your e-commerce store to Vercel.

## 📋 Pre-Deployment Checklist

- [x] Build command fixed (removed `--turbopack` flag)
- [x] `vercel.json` configuration created
- [ ] MongoDB database set up (MongoDB Atlas recommended)
- [ ] Environment variables ready
- [ ] Stripe account configured

## 🔧 Required Environment Variables

You need to configure these environment variables in your Vercel project settings:

### Database
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce-store
```
**Note**: Use MongoDB Atlas for production. Local MongoDB won't work on Vercel.

### Authentication
```
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-min-32-characters
```
**Important**: 
- Generate secure random strings for JWT_SECRET and NEXTAUTH_SECRET (at least 32 characters)
- NEXTAUTH_URL should be your actual Vercel domain

### Stripe (Payment Processing)
```
STRIPE_SECRET_KEY=sk_live_...  (use sk_test_... for testing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  (use pk_test_... for testing)
STRIPE_WEBHOOK_SECRET=whsec_...
```
**Important**: 
- Use test keys initially, switch to live keys when ready for production
- Configure Stripe webhook endpoint: `https://your-domain.vercel.app/api/payments/webhook`

### Optional Environment Variables
```
NEXT_PUBLIC_IMAGE_CDN=https://your-cdn.com
NEXT_PUBLIC_BASE_PATH=  (leave empty for root deployment)
```

## 🎯 Deployment Steps

### 1. Prepare MongoDB Database

**Option A: MongoDB Atlas (Recommended)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist Vercel IPs (or use `0.0.0.0/0` for all IPs)
5. Get your connection string
6. Replace `<password>` with your database user password

**Option B: Other MongoDB Hosting**
- Ensure your MongoDB instance is accessible from the internet
- Note the connection URI

### 2. Generate Secrets

Use these commands to generate secure secrets:

**For Unix/Mac:**
```bash
# JWT_SECRET
openssl rand -base64 32

# NEXTAUTH_SECRET
openssl rand -base64 32
```

**For Windows (PowerShell):**
```powershell
# JWT_SECRET
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# NEXTAUTH_SECRET
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### 3. Deploy to Vercel

**Option A: Using Vercel CLI**

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Follow the prompts and add environment variables when asked

**Option B: Using Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (should be auto-detected)
   - **Output Directory**: `.next` (should be auto-detected)
   - **Install Command**: `npm install` (should be auto-detected)

5. Add environment variables:
   - Click "Environment Variables"
   - Add each variable from the list above
   - Make sure to add them for **Production**, **Preview**, and **Development** environments

6. Click "Deploy"

### 4. Configure Stripe Webhooks

After your first deployment:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set the endpoint URL: `https://your-domain.vercel.app/api/payments/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret
6. Add it to Vercel as `STRIPE_WEBHOOK_SECRET` environment variable
7. Redeploy your application (or wait for the next deployment)

### 5. Run Database Migrations

After successful deployment, run migrations to set up your database:

**Option A: Using Vercel CLI**
```bash
vercel env pull .env.production.local
npm run migrate:up
```

**Option B: Using a Script API Route**
- Navigate to `https://your-domain.vercel.app/api/migrations/run` (if you create this endpoint)
- Or run migrations locally using production database connection

## 🔍 Post-Deployment Verification

### Check These Pages:
- [ ] Home page loads: `https://your-domain.vercel.app`
- [ ] Products page: `https://your-domain.vercel.app/products`
- [ ] Login page: `https://your-domain.vercel.app/login`
- [ ] API health: `https://your-domain.vercel.app/api/health` (if available)

### Test Core Functionality:
- [ ] User registration and login
- [ ] Product browsing
- [ ] Add to cart
- [ ] Checkout process
- [ ] Admin dashboard (if applicable)

### Monitor:
- [ ] Check Vercel deployment logs
- [ ] Check MongoDB Atlas logs
- [ ] Check Stripe dashboard for webhook deliveries

## 🐛 Troubleshooting

### Build Fails

**Problem**: Build fails with turbopack error
**Solution**: ✅ Already fixed! The `--turbopack` flag has been removed from the build command.

**Problem**: TypeScript errors during build
**Solution**: Check `next.config.ts` - ESLint is already set to ignore errors during builds, but TypeScript errors will still fail the build.

### Database Connection Issues

**Problem**: Cannot connect to MongoDB
**Solution**: 
- Verify `MONGODB_URI` is correct in Vercel environment variables
- Check MongoDB Atlas network access settings
- Ensure database user credentials are correct

### Environment Variables Not Working

**Problem**: App doesn't recognize environment variables
**Solution**:
- Environment variables starting with `NEXT_PUBLIC_` are embedded at build time
- Server-side variables are available at runtime
- After adding new variables, trigger a new deployment

### Stripe Webhooks Not Working

**Problem**: Payments succeed but orders don't update
**Solution**:
- Verify webhook endpoint is configured in Stripe dashboard
- Check `STRIPE_WEBHOOK_SECRET` is set correctly in Vercel
- Check Vercel function logs for webhook errors
- Verify webhook events are selected correctly in Stripe

## 📊 Performance Optimization

### Recommendations:
1. **Enable Vercel Analytics** in your project settings
2. **Use Vercel Image Optimization** (already configured in `next.config.ts`)
3. **Monitor MongoDB Performance** in Atlas dashboard
4. **Set up Edge Caching** for static content
5. **Enable ISR (Incremental Static Regeneration)** for product pages

### Image Optimization
Your `next.config.ts` already includes remote patterns for:
- images.unsplash.com
- github.com
- raw.githubusercontent.com
- cdn.shopify.com
- www.angeljackets.com

Add more patterns as needed for your product images.

## 🔒 Security Checklist

- [ ] Use strong, unique values for JWT_SECRET and NEXTAUTH_SECRET
- [ ] Use Stripe live keys only in production
- [ ] Enable MongoDB Atlas IP whitelisting (if possible)
- [ ] Set up Vercel password protection for preview deployments
- [ ] Configure CORS policies for API routes
- [ ] Enable Stripe webhook signature verification (already implemented)
- [ ] Review and restrict MongoDB user permissions

## 🔄 Continuous Deployment

Your project is now set up for automatic deployments:

- **Production**: Pushes to `main` branch → Auto-deploy to production
- **Preview**: Pull requests → Auto-deploy to preview URLs
- **Development**: Feature branches → Can be deployed on demand

## 📝 Custom Domain Setup

To use a custom domain:

1. Go to your Vercel project → Settings → Domains
2. Add your domain
3. Configure DNS records as instructed by Vercel
4. Update `NEXTAUTH_URL` environment variable with your custom domain
5. Update Stripe webhook URL with your custom domain

## 🆘 Support

If you encounter issues:

1. Check [Vercel Documentation](https://vercel.com/docs)
2. Check [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
3. Review Vercel deployment logs
4. Check this project's [README.md](./README.md)

---

**Your project is now ready for Vercel deployment! 🎉**

