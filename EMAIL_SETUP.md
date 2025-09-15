# Email Setup Instructions

This ecommerce store now includes email functionality using Nodemailer with Gmail SMTP. All emails will be sent to `testleadz04@gmail.com` as requested.

## Setup Steps

### 1. Create Gmail App Password

1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification (enable if not already)
3. Go to App passwords
4. Generate a new app password for "Mail"
5. Copy the 16-character password

### 2. Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce-store

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Email Configuration (Gmail SMTP)
EMAIL_USER=testleadz04@gmail.com
EMAIL_PASS=your_gmail_app_password_here

# Alternative: Use APP_PASSWORD instead of EMAIL_PASS
# APP_PASSWORD=your_gmail_app_password_here

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
```

### 3. Email Features Implemented

#### Contact Form (`/contact`)
- Sends contact form submissions to `testleadz04@gmail.com`
- Sends confirmation email to the customer
- Includes inquiry type, subject, and message details

#### Order Confirmation (`/checkout`)
- Sends order confirmation to customer after successful payment
- Sends order notification to `testleadz04@gmail.com` for admin review
- Includes order details, items, shipping address, and total

### 4. Email Templates

The system includes professional HTML email templates for:
- Contact form submissions
- Order confirmations
- Admin notifications

### 5. Testing

1. Start your development server: `npm run dev`
2. Test the contact form at `/contact`
3. Test order confirmation by completing a checkout
4. Check `testleadz04@gmail.com` for received emails

### 6. Troubleshooting

If emails are not being sent:

1. Verify your Gmail app password is correct
2. Check that 2-Step Verification is enabled on your Google account
3. Ensure the environment variables are properly set
4. Check the server console for error messages
5. Verify that the Gmail account has "Less secure app access" enabled (if needed)

### 7. Production Considerations

For production deployment:
- Use environment variables provided by your hosting platform
- Consider using a dedicated email service like SendGrid or Mailgun for better deliverability
- Set up proper error logging and monitoring for email failures

## API Endpoints

- `POST /api/email/contact` - Send contact form email
- `POST /api/email/order-confirmation` - Send order confirmation email

Both endpoints return JSON responses and handle errors gracefully.
