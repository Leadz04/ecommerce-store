# When Are Cart Abandonment Emails Sent?

## Summary

Cart abandonment recovery emails are sent **1-2 hours after a cart is abandoned**, depending on when the automated cron job runs.

## Detailed Timing

### When Cart is Tracked
- Cart is automatically tracked when user views cart page for **2 seconds**
- Cart is considered "abandoned" when user leaves without completing checkout
- The system records the `lastActivityAt` timestamp

### When Email is Sent

**Minimum Wait Time**: 1 hour after cart was last active (`lastActivityAt`)

**Actual Send Time**: Between 1-2 hours after abandonment (depends on cron schedule)

### How It Works

1. **Cron Job Runs**: Every hour at the top of the hour (e.g., 1:00 PM, 2:00 PM, 3:00 PM)
   - Example schedule: `0 * * * *` (runs at :00 of every hour)

2. **Cron Checks For**: Carts that meet all these conditions:
   - Abandoned **1+ hours ago** (based on `lastActivityAt`)
   - Not yet recovered (`recovered: false`)
   - Email not already sent (`emailSent: false`)
   - User has email address (`userEmail` exists)

3. **Email is Sent**: To all matching carts found

### Examples

**Example 1:**
- User abandons cart at: **2:15 PM**
- Cron runs next at: **3:00 PM** (45 minutes later)
- Email sent at: **3:00 PM** (45 minutes after abandonment) ✅
- Reason: Cart was abandoned 45 minutes ago, but cron checks for 1+ hour old carts, so waits until next hour

**Example 2:**
- User abandons cart at: **2:05 PM**
- Cron runs next at: **3:00 PM** (55 minutes later)
- Email sent at: **3:00 PM** (55 minutes after abandonment) ✅
- Reason: Cart was only 55 minutes old when cron ran, so it waits until 4:00 PM

**Example 3:**
- User abandons cart at: **1:30 PM**
- Cron runs next at: **2:00 PM** (30 minutes later)
- Email sent at: **2:00 PM** (30 minutes after abandonment) ❌ **Will wait**
- Reason: Cart is only 30 minutes old, needs to be 1+ hours. Email sent at **3:00 PM** instead (90 minutes total)

**Example 4:**
- User abandons cart at: **1:10 PM**
- Cron runs next at: **2:00 PM** (50 minutes later)
- Email sent at: **3:00 PM** (110 minutes after abandonment)
- Reason: At 2:00 PM, cart was only 50 minutes old. At 3:00 PM, cart is 110 minutes old (1+ hours) ✅

### Key Points

- ⏰ **Minimum**: 1 hour after abandonment
- ⏰ **Maximum**: Up to 2 hours (if you abandon right before the cron runs)
- ⏰ **Average**: About 1.5 hours
- 🔄 **Cron Frequency**: Runs hourly at :00 minutes
- ✅ **Batch Processing**: Processes up to 50 carts per run

## Configuration

### Current Settings

**File**: `src/app/api/cart/abandonment/send-recovery/route.ts`
- Default `hoursSinceAbandonment`: **1 hour**
- Line 17: `const { abandonmentId, hoursSinceAbandonment = 1 } = body;`

**File**: `src/app/api/cron/cart-abandonment/route.ts`
- Cron calls with: `hoursSinceAbandonment: 1`
- Line 31: `hoursSinceAbandonment: 1, // Send emails for carts abandoned 1+ hours ago`
- Cron schedule: Every hour at :00 (`0 * * * *`)

### To Change Timing

You can adjust the timing by modifying:

1. **Change minimum wait time**:
   ```typescript
   // In send-recovery route.ts
   const { abandonmentId, hoursSinceAbandonment = 2 } = body; // Change to 2 hours
   ```

2. **Change cron frequency**:
   ```json
   // In vercel.json (if using Vercel)
   {
     "crons": [{
       "path": "/api/cron/cart-abandonment",
       "schedule": "0 */2 * * *"  // Every 2 hours instead of every hour
     }]
   }
   ```

3. **Send immediately for testing**:
   ```typescript
   // Set to 0 for instant emails (testing only)
   hoursSinceAbandonment: 0
   ```

## Testing

### Quick Test (Change Timing Temporarily)

For faster testing, you can:

1. **Manual send** (no wait):
   - Send email immediately by calling API with specific `abandonmentId`
   - No time restriction

2. **Reduce wait time**:
   - Temporarily change `hoursSinceAbandonment` to `0.5` (30 minutes)
   - Or set to `0.0167` (1 minute) for very fast testing

3. **Manual cron trigger**:
   - Call cron endpoint manually: `GET /api/cron/cart-abandonment`
   - Bypasses scheduled timing

### Production Best Practices

✅ **Recommended Timing**:
- First email: 1-2 hours after abandonment (current setting)
- Second email: 6-24 hours after abandonment (not implemented yet)
- Third email: 48-72 hours after abandonment (not implemented yet)

## Database Query to Check

```javascript
// Find carts ready for email (abandoned 1+ hours ago, no email sent)
db.cartabandonments.find({
  recovered: false,
  emailSent: false,
  userEmail: { $exists: true, $ne: null },
  lastActivityAt: { 
    $lte: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
  }
})
```

## Summary Table

| Event | Time | Description |
|-------|------|-------------|
| User adds items | T+0 | Cart tracking starts |
| User views cart | T+0 | Tracking confirmed (after 2 seconds) |
| User abandons cart | T+0 | `lastActivityAt` recorded |
| Cron job runs | T+60 to T+120 min | Checks for carts 1+ hours old |
| Email sent | T+60 to T+120 min | Email delivered to user |
| User receives email | T+60 to T+120 min | Checks inbox |

---

**Bottom Line**: Emails are sent **1-2 hours after cart abandonment**, depending on when the hourly cron job runs next.

