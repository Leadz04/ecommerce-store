# Etsy App Setup Guide

This guide walks you through the process of creating an Etsy App in the developer portal to enable the integration.

## Prerequisites
- An active Etsy Seller Account.
- Two-Factor Authentication (2FA) enabled on your Etsy account (required for developers).

## Step 1: Create an App
> [!IMPORTANT]
> **Account Requirement**: You MUST create this App while logged into the **Etsy account that owns your Shop**.
> Draft/Development apps can ONLY access data for the App Owner. If you create the app on Account A and try to connect Account B, it will fail.

1. Go to the [Etsy Developer API Dashboard](https://www.etsy.com/developers/your-apps).
2. Click on **"Create a New App"**.
3. Fill in the required details:
    - **Name**: Choose a unique name for your application (e.g., "My Store Integration").
    - **Description**: Briefly describe what the app does (e.g., "Inventory and Order sync for my personal ecommerce store").
    - **Application Website URL**: Enter your website URL (e.g., `https://your-store-domain.com` or `http://localhost:3000` for development).
    - **Inventory Management**: Select "Yes" if you plan to sync inventory.
    - **Listing Management**: Select "Yes" to sync listings.
4. Read and agree to the API Terms of Use.
5. Click **"Create App"**.

## Step 2: Configure Keys and Credentials
Once your app is created, you will see your **Keystring** (Client ID) and **Shared Secret** (Client Secret). 

1. Copy these values to your `.env.local` file:
   ```env
   ETSY_CLIENT_ID=your_keystring_here
   ETSY_CLIENT_SECRET=your_shared_secret_here
   ```

## Step 3: Set Callback URL
> [!IMPORTANT]
> This is crucial for authentication to work effectively.

1. In your Etsy App settings, look for the **"Callback URLs"** section.
2. Add the following URL:
   - For Local Development: `http://localhost:3000/api/etsy/auth`
   - For Production: `https://your-domain.com/api/etsy/auth`
3. Save your changes.
4. Update your `.env.local` file:
   ```env
   # Must match exactly what you entered in the Etsy portal
   ETSY_REDIRECT_URI=http://localhost:3000/api/etsy/auth
   ```

## Step 4: Compliance & Testing
Etsy has strict rules for testing apps.

- **Use Draft Listings**: When testing listing creation, always create listings in `draft` state (`state: 'draft'`).
- **Rate Limits**: The default rate limit is 10 requests per second and 10,000 requests per day.
- **Testing Policy**: Read the [Etsy API Testing Policy](https://www.etsy.com/legal/policy/api-testing-policy/169130941112) carefully.

## Verify Setup
1. Start your application.
2. Navigate to your Admin Dashboard > Settings > Etsy.
3. Click "Connect Etsy Shop".
4. You should be redirected to Etsy to approve the app.
5. After approval, you will be redirected back to your dashboard with a success message.
