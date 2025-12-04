# Testing Abandoned Cart - Customer & Guest Guide

Simple step-by-step guide to test abandoned cart functionality as a regular customer or guest user.

---

## Test 1: As a Logged-In Customer

### Step 1: Login to Your Account
1. Go to the login page
2. Enter your email and password
3. Click "Login"
4. Make sure you're successfully logged in

### Step 2: Add Items to Cart
1. Browse the products page
2. Add 2-3 different products to your cart
3. Make note of what items you added (names, quantities)

### Step 3: View Your Cart
1. Click on the cart icon or go to the cart page
2. You should see all the items you added
3. **Wait at least 3 seconds** on the cart page (the system needs time to track your cart)
4. Verify the cart shows:
   - Correct product names
   - Correct quantities
   - Correct prices
   - Total amount

### Step 4: Leave the Cart (Abandon It)
1. **Don't click checkout**
2. Instead, click "Continue Shopping" or just navigate to another page
3. Close the browser tab or leave the site

### Step 5: Wait and Check Email (If Configured)
1. **Wait at least 1 hour** after leaving the cart (emails are sent for carts abandoned 1+ hours ago)
2. **Important**: The cron job runs hourly, so you might receive the email:
   - Between 1-2 hours after abandoning (depends on when the cron runs next)
   - Example: If you abandon at 2:30 PM and cron runs at 3:00 PM, you'll get email at 3:00 PM (30 min wait)
   - Example: If you abandon at 2:45 PM and cron runs at 3:00 PM, you'll get email at 4:00 PM (75 min wait)
3. Check your email inbox (and spam folder)
4. Look for an email with subject: **"Complete Your Purchase - Items Waiting in Your Cart"**
5. The email should contain:
   - List of items you left in cart
   - Product images
   - Total amount
   - A button/link to return to your cart

### Step 6: Return via Email Link
1. If you received the email, click the "Return to Cart" link
2. Your cart should still have all the items
3. You can now proceed to checkout if you want

---

## Test 2: As a Guest User (Not Logged In)

### Step 1: Use Incognito/Private Window
1. Open a new incognito or private browsing window
   - Chrome: Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)
   - Firefox: Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)
   - Edge: Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)
2. **Important**: Don't login - stay as a guest

### Step 2: Add Items to Cart
1. Browse products
2. Add 2-3 items to your cart
3. Remember what you added

### Step 3: View Cart
1. Go to the cart page
2. Verify items are showing correctly
3. **Wait at least 3 seconds** on the cart page

### Step 4: Provide Email (If Prompted)
1. Some sites ask for email before checkout
2. If prompted, enter your email address
3. This allows the site to send you recovery emails

### Step 5: Leave the Cart
1. Don't complete checkout
2. Close the browser or navigate away

### Step 6: Check Email
1. **Wait at least 1 hour** after abandoning the cart
2. **Note**: Emails are sent hourly, so you'll receive it within 1-2 hours
3. Check the email you provided (and spam folder)
4. Look for the cart recovery email

---

## What Should Happen

✅ **Automatic Tracking**: Your cart should be automatically saved when you:
- Add items to cart
- View the cart page for at least 2-3 seconds
- Leave without checking out

✅ **Recovery Email**: You should receive an email **1-2 hours after abandoning** your cart with:
- Your cart items listed
- Product images
- Total price
- Link to complete your purchase

✅ **Cart Persistence**: When you return (via email link or just visiting the site):
- Items should still be in your cart
- Quantities should be preserved
- Prices should be the same

---

## Quick Test Scenarios

### Scenario 1: Change Your Mind
1. Add items to cart
2. View cart page
3. Remove some items
4. Add different items
5. Leave without checking out
6. **Expected**: Cart should track your final cart state

### Scenario 2: Multiple Sessions
1. Add items as guest
2. Close browser
3. Come back later (same browser)
4. **Expected**: Items might still be in cart (if cookies/session persists)

### Scenario 3: Complete Purchase
1. Add items to cart
2. Wait for cart to be tracked
3. Receive recovery email
4. Click email link and complete purchase
5. **Expected**: Cart should be marked as recovered (no more emails)

---

## How to Verify It's Working

### Simple Checks:
1. **Cart Tracking**:
   - Add items to cart
   - View cart page (wait 3 seconds)
   - Items should remain in cart if you leave and come back

2. **Email Delivery**:
   - Abandon a cart with items
   - Wait 1+ hours
   - Check your email inbox
   - Should receive cart recovery email

3. **Cart Recovery**:
   - Click the link in recovery email
   - Should return to cart with all items
   - Should be able to checkout

---

## Common Issues

### Problem: No email received
**Possible reasons**:
- You didn't wait long enough (need 1+ hour, may take up to 2 hours due to hourly cron)
- Email went to spam folder
- You didn't provide an email (for guest users)
- Email service not configured
- Cron job not running (check with admin)

**Solution**: 
- Wait 1-2 hours after abandoning cart
- Check spam folder
- Make sure email was provided
- Verify cron job is set up and running

### Problem: Cart is empty when returning
**Possible reasons**:
- Cart session expired
- Browser cleared cookies/storage
- Items went out of stock

**Solution**: This is normal behavior in some cases. Try adding items again.

### Problem: Items disappeared from cart
**Possible reasons**:
- Products are out of stock
- Products were removed/deleted
- Browser session expired

**Solution**: Check if products are still available, try adding again

---

## Testing Tips

1. **Use Real Email**: Use a real email address you can access to test recovery emails

2. **Be Patient**: Recovery emails are sent 1-2 hours after abandoning (cron runs hourly at the top of each hour)

3. **Test Both Ways**: 
   - Test as logged-in customer
   - Test as guest user
   - Both should work

4. **Check Spam**: Recovery emails might go to spam folder, check there too

5. **Multiple Items**: Test with different:
   - Number of items (1 item, 2-3 items, many items)
   - Product types
   - Quantities

---

## Quick Checklist

As a Customer:
- [ ] Logged in successfully
- [ ] Added items to cart
- [ ] Viewed cart page (waited 3+ seconds)
- [ ] Left without checking out
- [ ] Received recovery email (after 1+ hour)
- [ ] Clicked email link and cart still had items
- [ ] Was able to complete purchase

As a Guest:
- [ ] Added items without logging in
- [ ] Viewed cart page
- [ ] Provided email (if prompted)
- [ ] Left without checking out
- [ ] Received recovery email
- [ ] Cart was accessible via email link

---

**Remember**: The system automatically tracks your cart when you view the cart page for 2-3 seconds. No action needed from you - it happens automatically!

