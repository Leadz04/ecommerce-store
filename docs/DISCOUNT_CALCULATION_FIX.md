# Discount Calculation Fix Summary

## Issues Found

### 1. Cart Store Price Calculation
**Problem**: The `getTotalPrice()` function was using `item.product.price`, which could already be discounted if an email promo was applied. This caused:
- Incorrect subtotal calculations
- Double-discounting when promo codes were applied on top of email promos

**Fix**: Updated to use the original price when email promo is present:
```typescript
const basePrice = item.product.emailPromo?.originalPrice 
  || item.product.originalPrice 
  || item.product.price;
```

### 2. Cart Store Discount Calculation
**Problem**: The `getDiscountAmount()` function calculated discounts based on `item.product.price`, which might already be discounted. This could result in:
- Discounts being calculated on already-discounted prices
- Incorrect final totals

**Fix**: Updated to use original price for discount calculations, ensuring discounts are always calculated from the base price.

### 3. Checkout Page Price Submission
**Problem**: The checkout page was sending `item.product.price` (which could be discounted) as the base price to the order API. While the order API recalculates correctly, this could cause:
- Confusion in order records
- Potential issues if the order API logic changes

**Fix**: Updated to send the original/base price to the order API, letting the server-side logic handle discount calculations.

### 4. Cart Page Item Total Display
**Problem**: The cart page was calculating item totals using `item.product.price * quantity`, which might not account for email promo discounts properly in the display.

**Fix**: Updated to use `emailPromo.discountedPrice` when available for display purposes, ensuring users see the correct discounted price they'll pay.

## Verification

### Order API (Server-Side)
✅ **Correct**: The order API correctly:
- Fetches product price from database (source of truth)
- Calculates discounts using: `product.price * (1 - discountPercent / 100)`
- Stores original price in `promoOriginalPrice`
- Recalculates all totals server-side

### Calculation Flow
1. **Product Page**: When email promo is applied, product price is set to discounted price, but `originalPrice` is preserved
2. **Cart Store**: Now uses original price for all calculations
3. **Checkout**: Sends original price to order API
4. **Order API**: Recalculates everything from database product price (correct)

## Test Cases

### Test Case 1: Email Promo Only (Single Product)

**Setup:**
1. Navigate to a product page with an email promo applied (product should have `emailPromo` object)
2. Note the original price and discounted price shown on the product page

**Steps:**
1. Add 1 quantity of the product to cart
2. Go to cart page (`/cart`)
3. Verify the following:
   - ✅ Item shows discounted price (from `emailPromo.discountedPrice`)
   - ✅ Item total = discounted price × quantity
   - ✅ Subtotal = original price × quantity (for calculation purposes)
   - ✅ Shipping calculated on discounted subtotal
   - ✅ Tax calculated on discounted subtotal
4. Proceed to checkout (`/checkout`)
5. Verify:
   - ✅ Subtotal matches cart page
   - ✅ No "Promo savings" line (email promo is already applied to item price)
   - ✅ Total = subtotal + shipping + tax
6. Complete the order
7. Verify in order details:
   - ✅ Order subtotal uses original price from database
   - ✅ Discount applied correctly: `originalPrice × (1 - discountPercent/100)`
   - ✅ Final price matches what was shown at checkout

**Expected Calculation:**
- Product original price: $100.00
- Email promo discount: 20%
- Discounted price: $80.00
- Subtotal (for calculations): $100.00
- Item display price: $80.00
- Final order price: $80.00

---

### Test Case 2: Promo Code Only (Cart-Wide Discount)

**Setup:**
1. Add a product to cart (without email promo)
2. Note the product price

**Steps:**
1. Go to cart page
2. Verify subtotal = product price × quantity
3. Go to checkout page
4. Enter a valid promo code (e.g., 15% off)
5. Verify:
   - ✅ "Promo savings" line appears showing discount amount
   - ✅ Discount = subtotal × (discountPercent / 100)
   - ✅ Discounted subtotal = subtotal - discount
   - ✅ Shipping calculated on discounted subtotal
   - ✅ Tax calculated on discounted subtotal
   - ✅ Total = discounted subtotal + shipping + tax
6. Complete the order
7. Verify in order details:
   - ✅ Order shows original product price
   - ✅ Discount amount matches promo code discount
   - ✅ Final total matches checkout total

**Expected Calculation:**
- Product price: $100.00
- Quantity: 1
- Subtotal: $100.00
- Promo code: 15% off
- Discount: $100.00 × 0.15 = $15.00
- Discounted subtotal: $100.00 - $15.00 = $85.00
- Shipping: $9.99 (if subtotal < $100)
- Tax: $85.00 × 0.08 = $6.80
- Total: $85.00 + $9.99 + $6.80 = $101.79

---

### Test Case 3: Product-Specific Promo Code

**Setup:**
1. Create a promo code that applies to a specific product
2. Add that specific product to cart
3. Add a different product (without promo) to cart

**Steps:**
1. Go to checkout page
2. Enter the product-specific promo code
3. Verify:
   - ✅ Discount only applies to the matching product
   - ✅ Other products in cart are not discounted
   - ✅ Discount amount = (matching product price × quantity) × (discountPercent / 100)
   - ✅ Total calculation is correct
4. Complete the order
5. Verify in order:
   - ✅ Only the matching product has discount applied
   - ✅ Other products show full price

**Expected Calculation:**
- Product A (with promo): $100.00, Qty: 1
- Product B (no promo): $50.00, Qty: 1
- Subtotal: $150.00
- Promo: 20% off Product A only
- Discount: $100.00 × 0.20 = $20.00
- Discounted subtotal: $150.00 - $20.00 = $130.00

---

### Test Case 4: Email Promo + Promo Code (Same Product)

**Setup:**
1. Add a product with email promo to cart
2. Note: Email promo should take precedence

**Steps:**
1. Go to checkout page
2. Try to apply a promo code for the same product
3. Verify:
   - ✅ Email promo discount is already applied (shown in item price)
   - ✅ If promo code is applied, it should NOT stack (order API handles this)
   - ✅ Order API will recalculate and use the email promo (one discount only)
4. Complete the order
5. Verify:
   - ✅ Only one discount is applied (email promo takes precedence)
   - ✅ Final price matches email promo discounted price

**Expected Behavior:**
- Email promo discount is applied at product level
- Promo code should not double-discount
- Order API validates and applies only one discount

---

### Test Case 5: Multiple Products with Different Discounts

**Setup:**
1. Add Product A with email promo (20% off)
2. Add Product B without discount
3. Add Product C with originalPrice field (already on sale)

**Steps:**
1. Go to cart page
2. Verify:
   - ✅ Product A shows discounted price
   - ✅ Product B shows regular price
   - ✅ Product C shows sale price with original price crossed out
   - ✅ Subtotal = (Product A original × qty) + (Product B price × qty) + (Product C original × qty)
3. Go to checkout
4. Apply a cart-wide promo code (10% off)
5. Verify:
   - ✅ Discount applies to entire subtotal
   - ✅ Discount = subtotal × 0.10
   - ✅ Calculations are correct
6. Complete order
7. Verify:
   - ✅ Each product's price is calculated correctly
   - ✅ Order totals match checkout totals

**Expected Calculation:**
- Product A: Original $100, Email promo 20% → $80 (display), $100 (calc base)
- Product B: $50
- Product C: Original $75, Sale $60
- Subtotal (for calc): $100 + $50 + $75 = $225
- Cart-wide promo 10%: $225 × 0.10 = $22.50
- Discounted subtotal: $225 - $22.50 = $202.50

---

### Test Case 6: Free Shipping Threshold with Discounts

**Setup:**
1. Add products totaling $95.00 (before discount)

**Steps:**
1. Apply a 10% discount
2. Verify:
   - ✅ Subtotal after discount: $95.00 × 0.90 = $85.50
   - ✅ Shipping: $9.99 (because discounted subtotal < $100)
   - ✅ Free shipping threshold should be based on ORIGINAL subtotal, not discounted
3. Add more items to reach $100+ original subtotal
4. Verify:
   - ✅ Shipping becomes free
   - ✅ Calculations remain correct

**Expected Behavior:**
- Free shipping threshold: Check if ORIGINAL subtotal ≥ $100
- If original subtotal ≥ $100: Shipping = $0
- If original subtotal < $100: Shipping = $9.99

---

### Test Case 7: Edge Cases

#### 7a. Product with originalPrice but no email promo
**Steps:**
1. Add product with `originalPrice` field set (e.g., $100 original, $80 current)
2. Verify cart shows sale price with original crossed out
3. Verify calculations use originalPrice as base

#### 7b. Product with email promo but no originalPrice field
**Steps:**
1. Add product with email promo where `emailPromo.originalPrice` exists
2. Verify calculations use `emailPromo.originalPrice`
3. Verify display shows `emailPromo.discountedPrice`

#### 7c. Product without any discounts
**Steps:**
1. Add regular product (no originalPrice, no emailPromo)
2. Verify price calculations use `product.price` directly
3. Verify no discount logic interferes

#### 7d. Quantity > 1 with discount
**Steps:**
1. Add product with discount, quantity = 3
2. Verify:
   - ✅ Item total = discounted price × 3
   - ✅ Subtotal calculation = original price × 3
   - ✅ Discount calculations are correct

---

### Test Case 8: Rounding and Precision

**Steps:**
1. Test with prices that result in decimal places:
   - Product: $99.99 with 15% discount
   - Expected: $99.99 × 0.85 = $84.9915 → $84.99 (rounded)
2. Test with multiple items:
   - 3 × $33.33 = $99.99
   - Apply 10% discount
   - Verify rounding is consistent
3. Verify all prices display with 2 decimal places
4. Verify order totals match exactly (no rounding errors)

---

### Test Case 9: Promo Code Validation

**Steps:**
1. Try invalid promo code
   - ✅ Error message shown
   - ✅ No discount applied
2. Try expired promo code
   - ✅ Error message shown
   - ✅ No discount applied
3. Try promo code for wrong product
   - ✅ Error message shown
   - ✅ No discount applied
4. Try using same promo code twice
   - ✅ Order API should prevent duplicate usage
   - ✅ Second attempt should fail

---

### Test Case 10: Order API Recalculation

**Steps:**
1. Add items to cart with discounts
2. Note the client-side calculated totals
3. Complete order
4. Check order in database/admin panel
5. Verify:
   - ✅ Order API recalculated from database product prices
   - ✅ Server-side totals match client-side totals (within rounding)
   - ✅ `promoOriginalPrice` is stored correctly
   - ✅ `promoPercent` is stored correctly
   - ✅ Final `item.price` is the discounted price

---

## Test Checklist

Use this checklist to verify all fixes:

- [ ] Email promo discounts calculate correctly
- [ ] Promo code discounts calculate correctly
- [ ] Product-specific promo codes work
- [ ] Cart-wide promo codes work
- [ ] Multiple products with different discounts work
- [ ] Free shipping threshold works with discounts
- [ ] Rounding is correct (2 decimal places)
- [ ] Order API recalculates correctly
- [ ] No double-discounting occurs
- [ ] Original prices are preserved
- [ ] Display prices match user expectations
- [ ] Order totals match checkout totals
- [ ] Edge cases handled correctly

---

## How to Test

1. **Manual Testing**: Follow each test case step-by-step
2. **Browser Console**: Check for calculation errors in console
3. **Network Tab**: Verify API calls send correct prices
4. **Database**: Check order records for correct price storage
5. **Admin Panel**: Verify order details show correct calculations

## Expected Results

After all fixes:
- ✅ All discounts calculate from original/base prices
- ✅ No double-discounting occurs
- ✅ Client and server calculations match
- ✅ Order records are accurate
- ✅ User sees correct prices at each step

## Files Modified

1. `src/store/cartStore.ts`
   - Fixed `getTotalPrice()` to use original price
   - Fixed `getDiscountAmount()` to use original price

2. `src/app/checkout/page.tsx`
   - Fixed to send original price to order API

3. `src/app/cart/page.tsx`
   - Fixed item total display to show discounted price when email promo is applied

## Notes

- The order API is the source of truth and always recalculates from the database
- All client-side calculations are now consistent with server-side logic
- Original prices are preserved throughout the flow
- Discounts are always calculated from base/original prices, never from already-discounted prices

