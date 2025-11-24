# Coupon System Security Fixes - Testing Checklist

## Automated Testing

### Unit Tests (to be implemented)
- [ ] Usage limit enforcement
- [ ] Email validation logic
- [ ] Rate limiting behavior
- [ ] Token generation uniqueness
- [ ] Expiration handling

### Integration Tests (to be implemented)
- [ ] Complete checkout flow with promo
- [ ] Concurrent usage attempts
- [ ] Cross-user code sharing attempts

## Manual Testing Checklist

### Test Environment Setup
- [ ] Use development/staging environment
- [ ] Create test user accounts (user1@test.com, user2@test.com)
- [ ] Create test products
- [ ] Clear any existing promo codes

---

## Test Scenario 1: Usage Limit Enforcement

### Setup
1. Create a promo code with `maxUsageCount: 1`
2. Note the promo token

### Test Steps
1. **First Usage** ✅
   - [ ] Log in as user1@test.com
   - [ ] Apply promo code to cart
   - [ ] Complete checkout
   - [ ] **Expected**: Order succeeds with discount applied
   - [ ] **Verify**: `usageCount` = 1, user ID in `usedBy` array

2. **Second Usage Attempt** ❌
   - [ ] Try to use same promo code again
   - [ ] **Expected**: Error message "This discount code has already been used the maximum number of times."
   - [ ] **Verify**: Order fails or promo not applied

3. **Database Verification**
   - [ ] Check MongoDB: `usageCount >= maxUsageCount`
   - [ ] Check `usedBy` array contains user ID

---

## Test Scenario 2: Email Validation (Prevent Code Sharing)

### Setup
1. Create promo code for user1@test.com
2. Note the promo token

### Test Steps
1. **Correct User** ✅
   - [ ] Log in as user1@test.com
   - [ ] Apply promo code
   - [ ] **Expected**: Promo applies successfully

2. **Wrong User** ❌
   - [ ] Log out, log in as user2@test.com
   - [ ] Try to apply same promo code
   - [ ] **Expected**: Error "This discount code is not valid for your account"
   - [ ] **Verify**: Promo not applied to cart

3. **Validation API Test**
   - [ ] Call `/api/promotions/validate?token=XXX` with user2's auth
   - [ ] **Expected**: 403 status code
   - [ ] **Verify**: Error message about account mismatch

---

## Test Scenario 3: Rate Limiting

### Setup
1. Get a valid promo token
2. Use a tool like Postman or curl

### Test Steps
1. **Normal Usage** ✅
   - [ ] Make 5 requests to `/api/promotions/validate?token=XXX`
   - [ ] **Expected**: All succeed (200 status)

2. **Exceed Limit** ❌
   - [ ] Make 10 more requests rapidly (total 15)
   - [ ] **Expected**: After 10th request, get 429 status
   - [ ] **Verify**: Response includes `Retry-After` header
   - [ ] **Verify**: Error message "Too many requests"

3. **Wait and Retry** ✅
   - [ ] Wait 15 minutes (or check `Retry-After` value)
   - [ ] Make another request
   - [ ] **Expected**: Request succeeds again

---

## Test Scenario 4: Secure Token Generation

### Setup
1. Trigger promo email creation multiple times

### Test Steps
1. **Token Uniqueness**
   - [ ] Create 10 promo codes
   - [ ] **Verify**: All tokens are different
   - [ ] **Verify**: Tokens are 32 characters long (hex)

2. **Token Unpredictability**
   - [ ] Check tokens don't follow patterns like WELCOME15001, WELCOME15002
   - [ ] **Verify**: Tokens look random (e.g., "a3f5b2c8d9e1f4a7b6c3d2e9f8a1b4c7")

3. **Database Check**
   - [ ] Query MongoDB for duplicate tokens
   - [ ] **Expected**: Zero duplicates

---

## Test Scenario 5: Expired Promo Handling

### Setup
1. Create promo with short expiration (or manually update `expiresAt` in DB)

### Test Steps
1. **Before Expiration** ✅
   - [ ] Apply promo code
   - [ ] **Expected**: Works normally

2. **After Expiration** ❌
   - [ ] Wait for expiration or update DB
   - [ ] Try to apply promo
   - [ ] **Expected**: Error "This discount code has expired"
   - [ ] **Verify**: `status` changed to 'expired' in DB

---

## Test Scenario 6: Product-Specific Restrictions

### Setup
1. Create promo for Product A
2. Have Product B in catalog

### Test Steps
1. **Correct Product** ✅
   - [ ] Add Product A to cart
   - [ ] Apply promo code
   - [ ] **Expected**: Discount applied

2. **Wrong Product** ❌
   - [ ] Add Product B to cart
   - [ ] Try to apply same promo
   - [ ] **Expected**: Error "This discount code is only valid for specific products"

---

## Test Scenario 7: Concurrent Usage Prevention

### Setup
1. Create promo with `maxUsageCount: 1`
2. Open two browser windows (or use two devices)

### Test Steps
1. **Simultaneous Checkout**
   - [ ] Window 1: Add to cart, start checkout
   - [ ] Window 2: Add to cart, start checkout
   - [ ] Window 1: Apply promo, complete order
   - [ ] Window 2: Try to apply same promo
   - [ ] **Expected**: Window 2 gets error (already used)

---

## Test Scenario 8: Price Manipulation Prevention

### Setup
1. Create promo with 20% discount
2. Open browser DevTools

### Test Steps
1. **Client-Side Manipulation Attempt**
   - [ ] Apply promo code
   - [ ] In DevTools, modify `discountPercent` to 99
   - [ ] Complete checkout
   - [ ] **Expected**: Server recalculates with correct 20% discount
   - [ ] **Verify**: Order total matches server-calculated price

---

## Security Audit Checklist

### Code Review
- [ ] All promo validations happen server-side
- [ ] No client-side discount calculations trusted
- [ ] User authentication checked before promo application
- [ ] Rate limiting applied to all validation endpoints
- [ ] Tokens generated with crypto.randomBytes
- [ ] Database queries use proper indexing

### Penetration Testing
- [ ] Attempt SQL injection in token parameter
- [ ] Attempt XSS in promo code input
- [ ] Attempt to bypass rate limiting with IP rotation
- [ ] Attempt to reuse tokens after expiration
- [ ] Attempt to share tokens between accounts

### Performance Testing
- [ ] Load test with 100 concurrent promo validations
- [ ] Check database query performance
- [ ] Verify rate limiter doesn't cause memory leaks
- [ ] Test cleanup job performance

---

## Regression Testing

### Existing Functionality
- [ ] Normal checkout without promo still works
- [ ] Product browsing unaffected
- [ ] Cart functionality unchanged
- [ ] User authentication still works
- [ ] Email sending still works

---

## Success Criteria

✅ **All tests pass**
✅ **Zero unauthorized promo usage**
✅ **No code sharing between accounts**
✅ **Rate limiting blocks excessive requests**
✅ **All tokens are cryptographically secure**
✅ **No performance degradation**
✅ **No regression in existing features**

---

## Test Results Log

| Test Scenario | Date | Tester | Result | Notes |
|--------------|------|--------|--------|-------|
| Usage Limit | | | | |
| Email Validation | | | | |
| Rate Limiting | | | | |
| Token Generation | | | | |
| Expiration | | | | |
| Product Restrictions | | | | |
| Concurrent Usage | | | | |
| Price Manipulation | | | | |

---

## Known Issues / Notes

(Document any issues found during testing here)
