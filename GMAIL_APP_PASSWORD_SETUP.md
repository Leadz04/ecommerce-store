# 📧 Gmail App Password Setup Guide

## Step-by-Step Instructions to Create and Use Gmail App Password

### Step 1: Enable 2-Step Verification (Required)

**Why?** Gmail requires 2-Step Verification to be enabled before you can create an App Password.

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Sign in with your Gmail account (e.g., `testleadz04@gmail.com`)
3. Scroll down to **"2-Step Verification"**
4. Click **"Get started"** or **"Turn on"** if not already enabled
5. Follow the prompts to set up 2-Step Verification:
   - Enter your phone number
   - Verify with a code sent via SMS or phone call
   - Confirm the setup

**Note:** This is a one-time setup and adds an extra layer of security to your account.

---

### Step 2: Create App Password

1. Go back to [Google Account Security](https://myaccount.google.com/security)
2. Scroll down to **"2-Step Verification"** section
3. Click on **"App passwords"** (this appears after 2-Step Verification is enabled)
4. You may be asked to sign in again for security
5. On the App passwords page:
   - **Select app:** Choose "Mail"
   - **Select device:** Choose "Other (Custom name)"
   - **Enter name:** Type something like "ShopEase Email" or "Ecommerce Store"
   - Click **"Generate"**
6. **Copy the 16-character password** that appears
   - It will look like: `abcd efgh ijkl mnop` (with spaces) or `abcdefghijklmnop` (without spaces)
   - **Important:** You can only see this password once! Copy it immediately.

**Example App Password:**
```
abcd efgh ijkl mnop
```
or
```
abcdefghijklmnop
```

---

### Step 3: Add to Your Project

#### Option A: Create `.env.local` File (Recommended)

1. In your project root directory (`ecommerce-store`), create a file named `.env.local`
2. Add the following content:

```env
# Email Configuration (Gmail SMTP)
EMAIL_USER=testleadz04@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

**Replace `abcdefghijklmnop` with your actual 16-character app password** (remove spaces if any)

#### Option B: Add to Existing `.env.local`

If you already have a `.env.local` file, just add these two lines:

```env
EMAIL_USER=testleadz04@gmail.com
EMAIL_PASS=your_16_character_app_password_here
```

**Important Notes:**
- ✅ Remove any spaces from the app password
- ✅ Don't use quotes around the password
- ✅ The `.env.local` file should be in your project root (same level as `package.json`)
- ✅ Never commit `.env.local` to Git (it should be in `.gitignore`)

---

### Step 4: Verify Your Setup

Your code in `src/lib/email.ts` is already configured to use these environment variables:

```typescript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'testleadz04@gmail.com',
    pass: process.env.EMAIL_PASS || process.env.APP_PASSWORD,
  },
});
```

This means:
- It will use `EMAIL_USER` from your `.env.local` file
- It will use `EMAIL_PASS` from your `.env.local` file
- If not found, it falls back to defaults

---

### Step 5: Restart Your Development Server

**Important:** After adding environment variables, you MUST restart your server:

1. Stop your current server (Ctrl+C in terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

Environment variables are only loaded when the server starts, so changes won't take effect until you restart.

---

### Step 6: Test Your Email Setup

#### Test 1: Contact Form
1. Go to `/contact` on your site
2. Fill out and submit the contact form
3. Check `testleadz04@gmail.com` inbox for the email

#### Test 2: Send Test Email via API
You can test directly using curl or Postman:

```bash
curl -X POST http://localhost:3000/api/email/send-conversion \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-test-email@example.com",
    "emailType": "welcome"
  }'
```

---

## Troubleshooting

### ❌ Error: "Invalid login" or "Authentication failed"

**Solutions:**
1. ✅ Verify 2-Step Verification is enabled
2. ✅ Double-check the app password (no spaces, correct characters)
3. ✅ Make sure you're using the App Password, NOT your regular Gmail password
4. ✅ Restart your development server after adding environment variables

### ❌ Error: "Less secure app access"

**Solution:**
- Gmail no longer supports "Less secure app access"
- You MUST use App Passwords (which requires 2-Step Verification)
- This is the only way to authenticate with Gmail now

### ❌ Emails not sending

**Check:**
1. ✅ Check server console for error messages
2. ✅ Verify `.env.local` file exists in project root
3. ✅ Verify environment variable names are correct (`EMAIL_USER`, `EMAIL_PASS`)
4. ✅ Restart server after adding environment variables
5. ✅ Check Gmail account for any security alerts

### ❌ "App passwords" option not showing

**Solution:**
- You MUST enable 2-Step Verification first
- Wait a few minutes after enabling 2-Step Verification
- Try refreshing the Google Account Security page
- Make sure you're signed in to the correct Google account

---

## Complete `.env.local` Example

Here's a complete example of what your `.env.local` file should look like:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce-store

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Email Configuration (Gmail SMTP)
EMAIL_USER=testleadz04@gmail.com
EMAIL_PASS=abcdefghijklmnop

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Security Best Practices

1. ✅ **Never commit `.env.local` to Git**
   - It should already be in `.gitignore`
   - Check: `cat .gitignore | grep env`

2. ✅ **Use different app passwords for different projects**
   - Create a new app password for each project
   - Name them clearly (e.g., "ShopEase Production", "ShopEase Development")

3. ✅ **Rotate app passwords regularly**
   - Delete old app passwords you're not using
   - Generate new ones periodically

4. ✅ **For production:**
   - Use environment variables provided by your hosting platform
   - Never hardcode passwords in code
   - Consider using a dedicated email service (SendGrid, Mailgun) for better deliverability

---

## Quick Reference

| What | Where | Example |
|------|-------|---------|
| **Gmail Account** | Your email address | `testleadz04@gmail.com` |
| **App Password** | 16 characters from Google | `abcdefghijklmnop` |
| **Environment Variable** | `.env.local` file | `EMAIL_PASS=abcdefghijklmnop` |
| **Code Usage** | `src/lib/email.ts` | `process.env.EMAIL_PASS` |

---

## Need Help?

If you're still having issues:

1. **Check the server logs** - Look for error messages in your terminal
2. **Verify the app password** - Try generating a new one
3. **Test with a simple email** - Use the contact form first
4. **Check Gmail security** - Look for any security alerts in your Gmail account

---

## Summary Checklist

- [ ] Enabled 2-Step Verification on Google Account
- [ ] Created App Password for "Mail"
- [ ] Copied the 16-character app password
- [ ] Created/updated `.env.local` file in project root
- [ ] Added `EMAIL_USER=testleadz04@gmail.com`
- [ ] Added `EMAIL_PASS=your_app_password` (no spaces)
- [ ] Restarted development server
- [ ] Tested email sending
- [ ] Verified emails are received

---

**That's it! Your email system should now be working. 🎉**

