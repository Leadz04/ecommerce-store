This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


<!-- 

I can see the issue! The Stripe CLI is trying to forward webhooks to `localhost:4242/webhook`, but your Next.js application is running on `localhost:3000`. The webhook endpoint should be `localhost:3000/api/payments/webhook`.

Let me help you fix this:

## **�� Fix the Stripe Webhook Configuration**

You need to update the Stripe CLI command to point to the correct webhook endpoint:

**Stop the current Stripe CLI process** (Ctrl+C) and run this instead:

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

## **🔑 Update Your Environment Variables**

You also need to add the webhook signing secret to your `.env.local` file. From the console output, I can see your webhook signing secret is:

```
whsec_ff28a847815eb674ddc2ed6ca6b919e2d0a166fc2228d70507202ef5ad58d1ed
```

Add this to your `.env.local` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_ff28a847815eb674ddc2ed6ca6b919e2d0a166fc2228d70507202ef5ad58d1ed
```

## **📋 Complete Steps:**

1. **Stop the current Stripe CLI** (Ctrl+C in the terminal)

2. **Update your `.env.local` file** with the webhook secret:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_ff28a847815eb674ddc2ed6ca6b919e2d0a166fc2228d70507202ef5ad58d1ed
   ```

3. **Restart your Next.js development server** (if it's not running):
   ```bash
   npm run dev
   ```

4. **Start Stripe CLI with the correct endpoint**:
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```

## **✅ What This Fixes:**

- **Webhook Delivery**: Stripe will now successfully deliver webhooks to your application
- **Payment Processing**: Payment confirmations will be properly handled
- **Order Updates**: Orders will be automatically updated when payments succeed
- **Error Resolution**: The "connection refused" errors will disappear

The webhook endpoint at `/api/payments/webhook` is already implemented in your codebase and will handle the payment events properly once the Stripe CLI is configured correctly.
 -->