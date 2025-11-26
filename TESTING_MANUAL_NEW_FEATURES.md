# Testing Manual - Newly Implemented Features

This manual provides step-by-step testing instructions for all recently implemented features in the e-commerce store.

## 📋 Table of Contents

1. [Product Features](#product-features)
2. [Checkout & Order Features](#checkout--order-features)
3. [Customer Experience Features](#customer-experience-features)
4. [Advanced Features](#advanced-features)
5. [Analytics Features](#analytics-features)
6. [Support Features](#support-features)

---

## 🛍️ Product Features

### 1. Product Comparison Tool

**Location:** `/compare` or product cards

**Test Steps:**
1. Navigate to the products page (`/products`)
2. Click the "Compare" button on any product card
3. Add up to 4 products to comparison
4. Navigate to `/compare` to view the comparison table
5. Verify all product details are displayed side-by-side:
   - Product name, image, price
   - Description, specifications
   - Rating and reviews
   - Stock status
6. Test removing products from comparison
7. Test adding more than 4 products (should show limit message)

**Expected Results:**
- Products are added to comparison list
- Comparison page shows side-by-side view
- Maximum 4 products can be compared
- All product details are accurately displayed

**API Endpoints to Test:**
- `GET /api/products?ids=id1,id2,id3` - Get products for comparison

---

### 2. Recently Viewed Products

**Location:** Product pages, user profile

**Test Steps:**
1. Browse multiple product pages (visit at least 3-4 products)
2. Check if "Recently Viewed" section appears on product detail pages
3. Navigate to user profile (`/profile`)
4. Verify "Recently Viewed Products" section shows visited products
5. Test that products persist after page refresh (local storage)
6. Test clearing recently viewed history

**Expected Results:**
- Recently viewed section appears on product pages
- Products are tracked in local storage
- Profile page shows recently viewed products
- Products persist across sessions

**API Endpoints to Test:**
- `GET /api/products/recently-viewed` - Get recently viewed products

---

### 3. Product Recommendations

**Location:** Product detail pages, homepage

**Test Steps:**
1. Visit a product detail page
2. Scroll to "You May Also Like" section
3. Verify recommendations are based on:
   - Same category products
   - Similar tags
   - Related products
4. Visit homepage while logged in
5. Check "Recommended for You" section
6. Verify recommendations are personalized based on:
   - Purchase history
   - Wishlist items
   - Browsing history

**Expected Results:**
- Recommendations appear on product pages
- Recommendations are relevant to current product
- Personalized recommendations on homepage
- Recommendations update based on user activity

**API Endpoints to Test:**
- `GET /api/products/[id]/recommendations` - Get product recommendations
- `GET /api/homepage/personalized` - Get personalized homepage content

---

### 4. Social Share Buttons

**Location:** Product detail pages

**Test Steps:**
1. Navigate to any product detail page
2. Find the social share buttons (usually near product title)
3. Test each share button:
   - **Facebook:** Opens Facebook share dialog
   - **Twitter:** Opens Twitter share with product link
   - **LinkedIn:** Opens LinkedIn share dialog
   - **Email:** Opens email client with product link
   - **Copy Link:** Copies product URL to clipboard
4. On mobile devices, test native share API
5. Verify shared links include correct product URL and metadata

**Expected Results:**
- All share buttons are visible and functional
- Links are correctly formatted
- Mobile devices show native share sheet
- Copy link shows confirmation message

---

### 5. "X sold in last 24 hours" Counter

**Location:** Product detail pages

**Test Steps:**
1. Navigate to a product detail page
2. Look for sales counter (e.g., "12 sold in last 24 hours")
3. Verify the counter displays a number
4. Check that the number updates based on actual sales
5. Test with products that have no recent sales (should show 0 or hide)

**Expected Results:**
- Counter displays accurate sales count
- Updates reflect last 24 hours only
- Counter is visible on product pages

**API Endpoints to Test:**
- `GET /api/products/[id]/sales-count` - Get sales count for last 24 hours

---

### 6. Product Questions & Answers

**Location:** Product detail pages

**Test Steps:**

**As Guest User:**
1. Navigate to a product detail page
2. Scroll to Q&A section
3. Click "Ask a Question"
4. Enter question text
5. Provide name and email
6. Submit question
7. Verify question appears (may need approval)

**As Authenticated User:**
1. Log in to your account
2. Navigate to a product detail page
3. Ask a question (name/email should be pre-filled)
4. Answer other users' questions
5. Vote questions/answers as helpful
6. Verify seller/admin answers are auto-approved

**Admin Testing:**
1. Log in as admin
2. Navigate to product Q&A section
3. Answer questions as seller
4. Verify answers are auto-approved
5. Moderate inappropriate questions/answers

**Expected Results:**
- Questions can be asked by guests and authenticated users
- Answers can be provided by community
- Helpful voting works
- Admin/seller answers are auto-approved
- Moderation system works

**API Endpoints to Test:**
- `POST /api/products/[id]/questions` - Ask a question
- `POST /api/products/[id]/questions/[questionId]/answers` - Answer a question
- `PUT /api/products/[id]/questions/[questionId]/helpful` - Vote helpful

---

## 🛒 Checkout & Order Features

### 7. Guest Checkout

**Test Steps:**
1. Add items to cart
2. Proceed to checkout
3. Verify "Checkout as Guest" option is available
4. Complete checkout without creating account:
   - Enter shipping address
   - Enter email address
   - Enter payment information
   - Place order
5. Verify order confirmation is received
6. Test order tracking with guest email
7. Test option to create account after purchase

**Expected Results:**
- Guest checkout option is available
- Order can be placed without account
- Guest email is collected
- Order confirmation email is sent
- Order can be tracked with email

**API Endpoints to Test:**
- `POST /api/orders` - Create order (with guestEmail field)

---

### 8. Saved Payment Methods

**Test Steps:**
1. Log in to your account
2. Add items to cart and proceed to checkout
3. Enter payment information
4. Check "Save payment method" checkbox
5. Complete order
6. Go to account settings or payment methods page
7. Verify saved payment method appears
8. Start new checkout
9. Verify saved payment methods are available
10. Test selecting saved payment method
11. Test deleting saved payment method

**Expected Results:**
- Payment methods can be saved
- Saved methods appear in account
- Saved methods can be used in checkout
- Saved methods can be deleted

**API Endpoints to Test:**
- `GET /api/payment-methods` - Get saved payment methods
- `POST /api/payment-methods` - Save payment method
- `DELETE /api/payment-methods/[id]` - Delete payment method

---

### 9. Order Notes/Comments

**Test Steps:**
1. Add items to cart
2. Proceed to checkout
3. Find "Order Notes" or "Special Instructions" field
4. Enter a note (e.g., "Leave at front door")
5. Complete checkout
6. Verify note is saved with order
7. Check order details page - note should be visible
8. As admin, verify note appears in order management

**Expected Results:**
- Notes field is available in checkout
- Notes are saved with order
- Notes are visible in order details
- Notes appear in admin order view

---

### 10. Delivery Instructions

**Test Steps:**
1. Add items to cart
2. Proceed to checkout
3. Find "Delivery Instructions" field
4. Enter instructions (e.g., "Ring doorbell twice")
5. Complete checkout
6. Verify instructions are saved
7. Check order details - instructions should be visible
8. As admin, verify instructions appear in order management

**Expected Results:**
- Delivery instructions field is available
- Instructions are saved with order
- Instructions are visible to admin

---

### 11. Separate Billing Address

**Test Steps:**
1. Add items to cart
2. Proceed to checkout
3. Enter shipping address
4. Look for billing address section
5. Test "Same as shipping" checkbox:
   - Check it - billing should match shipping
   - Uncheck it - separate billing form should appear
6. Enter different billing address
7. Complete checkout
8. Verify both addresses are saved correctly
9. Check order details - both addresses should be visible

**Expected Results:**
- Billing address section is available
- "Same as shipping" checkbox works
- Separate billing address can be entered
- Both addresses are saved correctly

---

### 12. Estimated Delivery Date Selection

**Test Steps:**
1. Add items to cart
2. Proceed to checkout
3. Look for "Estimated Delivery Date" or "Preferred Delivery Date" field
4. Select a delivery date from calendar
5. Complete checkout
6. Verify selected date is saved with order
7. Check order details - date should be visible
8. Test with different shipping addresses (dates may vary)

**Expected Results:**
- Delivery date selector is available
- Date can be selected
- Date is saved with order
- Date appears in order details

---

### 13. Delivery Confirmation Email

**Test Steps:**
1. Place an order (as customer or admin can update status)
2. As admin, update order status to "delivered"
3. Verify customer receives delivery confirmation email
4. Check email content:
   - Order number
   - Delivery confirmation message
   - Order summary
   - Link to order details

**Expected Results:**
- Email is sent when order status changes to "delivered"
- Email contains correct order information
- Email is sent to correct recipient

**API Endpoints to Test:**
- `PUT /api/admin/orders/[id]` - Update order status (triggers email)

---

### 14. Reorder Functionality

**Test Steps:**
1. Log in to your account
2. Navigate to order history (`/orders`)
3. Find a past order
4. Click "Reorder" button
5. Verify all items from that order are added to cart
6. Check cart - items should match previous order
7. Test reorder from order details page
8. Test reorder with out-of-stock items (should handle gracefully)

**Expected Results:**
- Reorder button is visible on past orders
- Clicking reorder adds items to cart
- All items from order are added
- Out-of-stock items are handled appropriately

**API Endpoints to Test:**
- `POST /api/orders/[id]/reorder` - Reorder functionality

---

### 15. Cancel Order

**Test Steps:**
1. Place a new order
2. Navigate to order details page
3. Verify "Cancel Order" button is visible (within 24 hours)
4. Click cancel order
5. Confirm cancellation
6. Verify order status changes to "cancelled"
7. Verify cancellation email is sent
8. Test canceling order after 24 hours (should not be allowed)
9. Test canceling already shipped order (should not be allowed)

**Expected Results:**
- Cancel button appears within 24 hours
- Cancellation works for eligible orders
- Order status updates to "cancelled"
- Cancellation email is sent
- Cancellation is blocked after 24 hours
- Cancellation is blocked for shipped orders

**API Endpoints to Test:**
- `POST /api/orders/[id]/cancel` - Cancel order

---

### 16. Cart Abandonment Recovery

**Test Steps:**
1. Add items to cart (as guest or logged-in user)
2. Leave the site without completing checkout
3. Wait for cart abandonment tracking (usually 1 hour)
4. Verify cart abandonment record is created
5. As admin, trigger recovery email manually or wait for cron job
6. Check email inbox for recovery email
7. Click link in recovery email
8. Verify cart is restored
9. Complete checkout from recovery email

**Expected Results:**
- Cart abandonment is tracked
- Recovery email is sent (after 1 hour)
- Email contains cart items
- Link restores cart
- User can complete checkout

**API Endpoints to Test:**
- `POST /api/cart/abandonment` - Track cart abandonment
- `POST /api/cart/abandonment/send-recovery` - Send recovery emails
- `GET /api/cron/cart-abandonment` - Cron job endpoint

---

### 17. Estimated Delivery Date in Cart

**Test Steps:**
1. Add items to cart
2. Navigate to cart page (`/cart`)
3. Look for estimated delivery date display
4. Verify date is calculated based on:
   - Shipping address
   - Product availability
   - Shipping method
5. Test with different shipping addresses
6. Test with in-stock vs out-of-stock items

**Expected Results:**
- Estimated delivery date is displayed in cart
- Date is calculated correctly
- Date updates based on shipping address
- Date reflects product availability

---

## 👤 Customer Experience Features

### 18. Live Chat Support

**Test Steps:**
1. Navigate to any page on the site
2. Look for floating chat widget (usually bottom-right)
3. Click to open chat
4. Send a test message
5. Verify message is sent
6. Test as admin - verify messages appear in admin panel
7. Test response functionality
8. Test chat history persistence
9. Test on mobile devices

**Expected Results:**
- Chat widget is visible on all pages
- Chat can be opened and closed
- Messages can be sent
- Admin can respond
- Chat history is maintained

**API Endpoints to Test:**
- `GET /api/chat` - Get chat messages
- `POST /api/chat` - Send chat message

---

### 19. Support Tickets

**Test Steps:**

**Create Ticket (Guest):**
1. Navigate to support page (`/support`)
2. Click "Create Support Ticket"
3. Fill in ticket form:
   - Subject
   - Category
   - Priority
   - Message
   - Email and name (for guests)
4. Submit ticket
5. Verify ticket is created
6. Check email for ticket confirmation

**Create Ticket (Authenticated):**
1. Log in to account
2. Navigate to support page
3. Create ticket (email/name should be pre-filled)
4. Link ticket to order or product if applicable
5. Submit ticket

**View Tickets:**
1. Navigate to support tickets page
2. View list of tickets
3. Filter by status, category
4. Click on ticket to view details
5. Add messages to ticket
6. Verify ticket status updates

**Admin Testing:**
1. Log in as admin
2. Navigate to admin support tickets
3. View all tickets
4. Respond to tickets
5. Update ticket status
6. Assign tickets

**Expected Results:**
- Tickets can be created by guests and authenticated users
- Tickets are properly categorized
- Tickets can be linked to orders/products
- Admin can manage tickets
- Email notifications work

**API Endpoints to Test:**
- `GET /api/support/tickets` - Get tickets
- `POST /api/support/tickets` - Create ticket
- `GET /api/support/tickets/[id]` - Get ticket details
- `PUT /api/support/tickets/[id]` - Update ticket
- `POST /api/support/tickets/[id]/messages` - Add message

---

### 20. Knowledge Base

**Test Steps:**
1. Navigate to knowledge base (`/knowledge-base` or `/support`)
2. Browse knowledge base articles
3. Search for articles using search bar
4. Filter by category
5. Click on an article to read
6. Test "Was this helpful?" voting
7. Test related articles
8. Test article navigation

**Expected Results:**
- Knowledge base is accessible
- Articles are organized by category
- Search functionality works
- Articles are readable
- Helpful voting works
- Related articles are shown

**API Endpoints to Test:**
- `GET /api/knowledge-base` - Get articles
- `GET /api/knowledge-base/[slug]` - Get article details
- `PUT /api/knowledge-base/[slug]/helpful` - Vote helpful

---

### 21. Personalized Homepage

**Test Steps:**
1. Log in to your account
2. Navigate to homepage
3. Verify personalized sections appear:
   - "Recommended for You"
   - "Based on Your Wishlist"
   - "Trending in Your Categories"
4. Browse some products
5. Add items to wishlist
6. Make a purchase
7. Return to homepage
8. Verify recommendations have updated

**Expected Results:**
- Personalized sections appear when logged in
- Recommendations are based on user activity
- Recommendations update over time
- Guest users see general recommendations

**API Endpoints to Test:**
- `GET /api/homepage/personalized` - Get personalized content

---

## 🎁 Advanced Features

### 22. Product Bundles

**Test Steps:**
1. Navigate to bundles page (if available) or `/api/bundles`
2. View available bundles
3. Click on a bundle to see details
4. Verify bundle shows:
   - All included products
   - Bundle price
   - Discount percentage
   - Savings amount
5. Add bundle to cart
6. Verify bundle is added as a single item
7. Complete checkout with bundle
8. Verify order shows bundle correctly

**Admin Testing:**
1. Log in as admin
2. Navigate to admin bundles page
3. Create a new bundle:
   - Add bundle name and description
   - Select products to include
   - Set bundle price
   - Set start/end dates (optional)
4. Save bundle
5. Verify bundle appears in public API
6. Test bundle availability dates

**Expected Results:**
- Bundles are displayed correctly
- Bundle pricing is accurate
- Discounts are calculated correctly
- Bundles can be added to cart
- Admin can create/manage bundles

**API Endpoints to Test:**
- `GET /api/bundles` - Get bundles
- `GET /api/bundles/[id]` - Get bundle details
- `POST /api/admin/bundles` - Create bundle (admin)
- `GET /api/admin/bundles` - List all bundles (admin)

---

### 23. Subscription Products

**Test Steps:**
1. Navigate to a product that supports subscriptions
2. Look for "Subscribe" option
3. Click subscribe
4. Select subscription frequency:
   - Weekly
   - Biweekly
   - Monthly
   - Quarterly
   - Yearly
5. Enter shipping address
6. Select payment method
7. Confirm subscription
8. Verify subscription is created
9. Navigate to account subscriptions page
10. View subscription details
11. Test pausing subscription
12. Test canceling subscription

**Admin Testing:**
1. Log in as admin
2. View all subscriptions
3. Test subscription delivery processing (via cron)
4. Verify orders are created for deliveries

**Expected Results:**
- Subscriptions can be created
- Subscription details are saved
- Users can manage subscriptions
- Subscription deliveries are processed
- Orders are created for deliveries

**API Endpoints to Test:**
- `GET /api/subscriptions` - Get user subscriptions
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions/[id]` - Get subscription details
- `PUT /api/subscriptions/[id]` - Update subscription
- `GET /api/cron/subscriptions` - Process deliveries (cron)

---

### 24. Pre-Orders

**Test Steps:**
1. Navigate to a product with pre-order option
2. Look for "Pre-Order" button
3. Click pre-order
4. Enter quantity
5. Enter shipping address (if guest, provide email)
6. Select payment method
7. Confirm pre-order
8. Verify pre-order is created
9. Check pre-order status
10. Wait for product release (or admin can trigger)
11. Verify order is automatically created when product is released
12. Check email notification

**Admin Testing:**
1. Log in as admin
2. View all pre-orders
3. Update product to in-stock
4. Trigger pre-order processing (via cron)
5. Verify orders are created

**Expected Results:**
- Pre-orders can be created
- Pre-order status is tracked
- Orders are created when product is released
- Email notifications are sent

**API Endpoints to Test:**
- `GET /api/pre-orders` - Get pre-orders
- `POST /api/pre-orders` - Create pre-order
- `GET /api/cron/pre-orders` - Process pre-orders (cron)

---

### 25. Back-in-Stock Notifications

**Test Steps:**
1. Navigate to an out-of-stock product
2. Look for "Notify Me When Available" button
3. Click button
4. Enter email (or use logged-in email)
5. Submit notification request
6. Verify confirmation message
7. As admin, update product to in-stock
8. Trigger stock notification cron job
9. Check email for back-in-stock notification
10. Verify email contains product details and link

**Expected Results:**
- Notification can be requested
- Duplicate notifications are prevented
- Email is sent when product is back in stock
- Email contains correct product information

**API Endpoints to Test:**
- `POST /api/products/[id]/stock-notify` - Subscribe to notifications
- `GET /api/products/[id]/stock-notify` - Check subscription status
- `GET /api/cron/stock-notifications` - Process notifications (cron)

---

### 26. Price Drop Alerts

**Test Steps:**
1. Navigate to a product
2. Look for "Price Alert" or "Notify When Price Drops" option
3. Click to set price alert
4. Enter target price (must be less than current price)
5. Enter email (or use logged-in email)
6. Submit alert
7. Verify alert is created
8. As admin, reduce product price to or below target
9. Trigger price alert cron job
10. Check email for price drop notification
11. Verify email shows savings amount
12. Test canceling price alert

**Expected Results:**
- Price alerts can be created
- Target price validation works
- Email is sent when price drops
- Email shows savings information
- Alerts can be canceled

**API Endpoints to Test:**
- `POST /api/products/[id]/price-alert` - Create price alert
- `GET /api/products/[id]/price-alert` - Check alert status
- `DELETE /api/products/[id]/price-alert` - Cancel alert
- `GET /api/cron/price-alerts` - Process alerts (cron)

---

## 📊 Analytics Features

### 27. Customer Analytics Dashboard

**Test Steps:**
1. Log in as admin
2. Navigate to admin analytics dashboard
3. Go to Customer Analytics section
4. View customer analytics:
   - Total customers
   - Customer segments (new, regular, VIP, at-risk)
   - Lifetime value
   - Average order value
   - Favorite products/categories
5. Filter by customer segment
6. View individual customer analytics
7. Test calculating analytics for a specific customer

**Expected Results:**
- Analytics dashboard is accessible
- Customer data is accurate
- Segments are correctly assigned
- Analytics can be filtered
- Individual customer analytics are available

**API Endpoints to Test:**
- `GET /api/admin/analytics/customers` - Get customer analytics
- `POST /api/admin/analytics/customers` - Calculate analytics

---

### 28. Purchase Analytics

**Test Steps:**
1. Log in as admin
2. Navigate to Purchase Analytics section
3. View analytics for a specific date or date range
4. Verify metrics:
   - Total revenue
   - Total orders
   - Average order value
   - Items sold
   - New vs returning customers
   - Top products
   - Top categories
   - Payment methods breakdown
5. Test generating analytics for a specific date
6. Compare analytics across different dates

**Expected Results:**
- Analytics are calculated correctly
- Metrics are accurate
- Date filtering works
- Top products/categories are listed
- Payment method breakdown is shown

**API Endpoints to Test:**
- `GET /api/admin/analytics/purchases` - Get purchase analytics
- `POST /api/admin/analytics/purchases` - Calculate analytics for date

---

### 29. Abandoned Cart Analytics

**Test Steps:**
1. Log in as admin
2. Navigate to Abandoned Cart Analytics section
3. View analytics for a specific date or date range
4. Verify metrics:
   - Total abandoned carts
   - Total cart value
   - Average cart value
   - Recovery rate
   - Time to abandonment
   - Top abandoned products
   - Email campaign performance (open rate, click rate, conversion)
5. Test generating analytics for a specific date
6. Compare recovery rates over time

**Expected Results:**
- Analytics are calculated correctly
- Abandonment metrics are accurate
- Recovery rates are shown
- Email performance metrics are available
- Top abandoned products are listed

**API Endpoints to Test:**
- `GET /api/admin/analytics/abandoned-carts` - Get analytics
- `POST /api/admin/analytics/abandoned-carts` - Calculate analytics

---

## 🔧 Testing Checklist

### Pre-Testing Setup
- [ ] Clear browser cache and cookies
- [ ] Use incognito/private browsing for guest testing
- [ ] Have test user accounts ready (customer, admin)
- [ ] Set up test email addresses
- [ ] Configure cron jobs (or test manually)
- [ ] Have test products with various states (in-stock, out-of-stock, pre-order)

### General Testing
- [ ] Test all features as guest user
- [ ] Test all features as authenticated user
- [ ] Test all features as admin user
- [ ] Test on desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices
- [ ] Test email notifications
- [ ] Verify API endpoints return correct data
- [ ] Check error handling

### Data Validation
- [ ] Verify all data is saved correctly
- [ ] Check database records match UI
- [ ] Verify email content is correct
- [ ] Check calculations (prices, discounts, totals)
- [ ] Verify dates and timestamps

### Performance Testing
- [ ] Test page load times
- [ ] Test API response times
- [ ] Test with large datasets
- [ ] Test concurrent users

---

## 🐛 Common Issues & Troubleshooting

### Issue: Feature not appearing
**Solution:** 
- Clear browser cache
- Check if feature is enabled in admin settings
- Verify user permissions
- Check browser console for errors

### Issue: API endpoint returns error
**Solution:**
- Check authentication token
- Verify request payload format
- Check server logs
- Verify database connection

### Issue: Email not sending
**Solution:**
- Check email configuration in `.env.local`
- Verify email service is working
- Check spam folder
- Verify email addresses are correct

### Issue: Cron jobs not running
**Solution:**
- Verify cron job is configured
- Check cron secret in environment variables
- Test cron endpoint manually
- Check server logs

---

## 📝 Test Results Template

Use this template to document your test results:

```
Feature: [Feature Name]
Date: [Date]
Tester: [Name]
Environment: [Development/Staging/Production]

Test Steps:
1. [Step 1]
2. [Step 2]
...

Results:
- [ ] Pass
- [ ] Fail
- [ ] Partial

Issues Found:
- [Issue description]

Notes:
[Additional notes]
```

---

## 🎯 Priority Testing Order

1. **Critical Features** (Test First):
   - Guest Checkout
   - Order Processing
   - Payment Methods
   - Order Cancellation

2. **Important Features** (Test Second):
   - Product Comparison
   - Recently Viewed
   - Recommendations
   - Support Tickets

3. **Advanced Features** (Test Third):
   - Bundles
   - Subscriptions
   - Pre-Orders
   - Notifications

4. **Analytics Features** (Test Last):
   - Customer Analytics
   - Purchase Analytics
   - Abandoned Cart Analytics

---

*Last Updated: December 2024*
*For questions or issues, contact the development team.*

