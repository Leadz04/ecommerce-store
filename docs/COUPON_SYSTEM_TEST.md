# Coupon System End-to-End Test

This checklist verifies that admins can issue coupon codes via promo emails and that shoppers can redeem them in checkout. Follow the steps in order in a staging environment.

---

## 1. Pre-Test Setup

1. Ensure the site and API are running with `NEXT_PUBLIC_SITE_URL` pointing to your test environment.
2. Confirm MongoDB is reachable and the `emailpromodiscounts` collection does **not** have the legacy `token_1` unique index (`db.emailpromodiscounts.dropIndex("token_1")` one time).
3. Clear any stored promo state in your browser (`localStorage.removeItem('email-promo-cache')`) to avoid cached data affecting results.
4. Prepare two test email inboxes (e.g., Gmail + Mailinator) for receiving promo emails.

---

## 2. Issue a Coupon Email (Admin Flow)

1. Log in as an admin at `/login`.
2. Open the admin dashboard at `/admin`.
3. Locate the product you want to promote and click the envelope icon (“Send promotional email”).
4. In the **Product Email Marketing** modal:
   - Add at least two recipient emails.
   - Set `Discount %` to a known value (e.g., 20).
   - Enter a human-friendly `Discount Code` (e.g., `SAVE20TEST`).
   - Optionally add a short custom message and pick any template.
5. Click **Send Emails** and wait for the success toast (`Sent X of Y emails successfully`).
6. In MongoDB, confirm each recipient produced an `EmailPromoDiscount` record with:
   - `token: SAVE20TEST`
   - `email` matching the recipient
   - `productId`, `discountPercent`, `usageCount: 0`, `status: active`

---

## 3. Validate Email Content

For each recipient inbox:

1. Open the promotional email.
2. Verify the template highlights the code (`SAVE20TEST`) in the discount box.
3. Hover over the “Shop Now” CTA and confirm the URL includes `?promo=SAVE20TEST`.
4. Click the CTA and ensure it loads the product page without errors.

---

## 4. Product Page Promo Auto-Apply

While on the product page opened from the email link:

1. Confirm the product details load without console errors.
2. The page should auto-validate the promo token (network call: `GET /api/promotions/validate?token=SAVE20TEST&productId=<id>`).
3. Check the UI for a success indicator (e.g., price showing the discounted amount). If not visible, inspect the `promo` state in React devtools.

---

## 5. Manual Coupon Entry at Checkout

1. Add the promoted product to the cart.
2. Proceed to `/checkout`.
3. In the order summary’s coupon box:
   - Enter `SAVE20TEST`.
   - Click **Apply** and confirm the toast shows success.
   - The order totals should display the discount row (Promo savings = subtotal × 20%).
4. Advance through Shipping → Payment to ensure the totals persist. You do **not** need to use a live card; stopping before payment is acceptable.

---

## 6. Coupon Usage Tracking

1. In MongoDB, confirm the matching `EmailPromoDiscount` document now shows `usageCount: 1`, `usedBy` containing the user ID, and `status: active` (until `maxUsageCount` is reached).
2. Verify the corresponding `Order` document stores the promo fields (`promoToken`, `promoPercent`, `promoOriginalPrice`) in the line item.

---

## 7. Negative Tests

- **Wrong User:** Log in as a different user and try `SAVE20TEST`; validator should return 403.
- **Wrong Product:** Apply the code to another product; API should respond 409.
- **Expired Code:** Manually set `expiresAt` in Mongo to a past date and re-validate; API should respond 410 with a friendly message.

---

## 8. Cleanup

1. Remove test promo records if desired:
   ```
   db.emailpromodiscounts.deleteMany({ token: "SAVE20TEST" })
   db.emailtrackings.deleteMany({ "metadata.promoToken": "SAVE20TEST" })
   ```
2. Clear browser storage again before future tests.

---

## Success Criteria

- Admins can send promo emails with custom codes without errors.
- Shoppers receive emails that display the correct code and link.
- Promo validation succeeds for the intended user/product and fails elsewhere.
- Checkout applies the discount and shows accurate totals.
- Order + promo tracking collections reflect the usage.

