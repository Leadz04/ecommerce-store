# Running Cron Jobs Locally

Guide for running cron jobs locally during development and testing.

## Available Cron Jobs

1. **Cart Abandonment** - `/api/cron/cart-abandonment`
2. **Pre-Orders** - `/api/cron/pre-orders`
3. **Price Alerts** - `/api/cron/price-alerts`
4. **Stock Notifications** - `/api/cron/stock-notifications`
5. **Subscriptions** - `/api/cron/subscriptions`

---

## Method 1: Manual Browser/API Calls (Simplest)

### Quick Test in Browser

1. **Start your local server**:
   ```bash
   npm run dev
   ```

2. **Open browser** and navigate to:
   ```
   http://localhost:3000/api/cron/cart-abandonment
   ```

3. **If CRON_SECRET is set**, you'll need to add it:
   ```
   http://localhost:3000/api/cron/cart-abandonment?secret=YOUR_CRON_SECRET
   ```
   (Note: This won't work if auth is checked. Use Method 2 instead.)

### Using curl (Terminal/Command Prompt)

**Without CRON_SECRET** (if not set):
```bash
curl http://localhost:3000/api/cron/cart-abandonment
```

**With CRON_SECRET** (if set in .env):
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/cart-abandonment
```

**All cron jobs**:
```bash
# Cart Abandonment
curl http://localhost:3000/api/cron/cart-abandonment

# Pre-Orders
curl http://localhost:3000/api/cron/pre-orders

# Price Alerts
curl http://localhost:3000/api/cron/price-alerts

# Stock Notifications
curl http://localhost:3000/api/cron/stock-notifications

# Subscriptions
curl http://localhost:3000/api/cron/subscriptions
```

---

## Method 2: Create NPM Scripts (Recommended)

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "cron:cart-abandonment": "curl http://localhost:3000/api/cron/cart-abandonment",
    "cron:pre-orders": "curl http://localhost:3000/api/cron/pre-orders",
    "cron:price-alerts": "curl http://localhost:3000/api/cron/price-alerts",
    "cron:stock-notifications": "curl http://localhost:3000/api/cron/stock-notifications",
    "cron:subscriptions": "curl http://localhost:3000/api/cron/subscriptions",
    "cron:all": "npm run cron:cart-abandonment && npm run cron:pre-orders && npm run cron:price-alerts && npm run cron:stock-notifications && npm run cron:subscriptions"
  }
}
```

Then run:
```bash
npm run cron:cart-abandonment
npm run cron:all
```

### Windows PowerShell Version

If you're on Windows and don't have curl, use PowerShell's `Invoke-WebRequest`:

```json
{
  "scripts": {
    "cron:cart-abandonment": "powershell -Command \"Invoke-WebRequest -Uri http://localhost:3000/api/cron/cart-abandonment | Select-Object -ExpandProperty Content\""
  }
}
```

---

## Method 3: Node.js Script (Best for Automation)

Create a file `scripts/run-cron.js`:

```javascript
const http = require('http');

const CRON_JOBS = {
  'cart-abandonment': '/api/cron/cart-abandonment',
  'pre-orders': '/api/cron/pre-orders',
  'price-alerts': '/api/cron/price-alerts',
  'stock-notifications': '/api/cron/stock-notifications',
  'subscriptions': '/api/cron/subscriptions',
};

const PORT = process.env.PORT || 3000;
const HOST = 'localhost';
const CRON_SECRET = process.env.CRON_SECRET;

function runCron(jobName) {
  return new Promise((resolve, reject) => {
    const path = CRON_JOBS[jobName];
    if (!path) {
      reject(new Error(`Unknown cron job: ${jobName}`));
      return;
    }

    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: 'GET',
      headers: {},
    };

    if (CRON_SECRET) {
      options.headers['Authorization'] = `Bearer ${CRON_SECRET}`;
    }

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log(`✅ ${jobName}:`, json.message || 'Success');
            resolve(json);
          } else {
            console.error(`❌ ${jobName}:`, json.error || 'Failed');
            reject(new Error(json.error || 'Failed'));
          }
        } catch (e) {
          console.error(`❌ ${jobName}: Parse error`, e.message);
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ ${jobName}:`, error.message);
      reject(error);
    });

    req.end();
  });
}

// Get job name from command line argument
const jobName = process.argv[2];

if (jobName === 'all') {
  // Run all cron jobs
  Promise.all(Object.keys(CRON_JOBS).map(runCron))
    .then(() => {
      console.log('\n✅ All cron jobs completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Some cron jobs failed:', error.message);
      process.exit(1);
    });
} else if (jobName && CRON_JOBS[jobName]) {
  // Run specific cron job
  runCron(jobName)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  console.log('Usage: node scripts/run-cron.js <job-name|all>');
  console.log('\nAvailable jobs:');
  Object.keys(CRON_JOBS).forEach((job) => {
    console.log(`  - ${job}`);
  });
  console.log('\nExamples:');
  console.log('  node scripts/run-cron.js cart-abandonment');
  console.log('  node scripts/run-cron.js all');
  process.exit(1);
}
```

Add to `package.json`:
```json
{
  "scripts": {
    "cron": "node scripts/run-cron.js",
    "cron:cart": "node scripts/run-cron.js cart-abandonment",
    "cron:all": "node scripts/run-cron.js all"
  }
}
```

Run:
```bash
npm run cron cart-abandonment
npm run cron all
```

---

## Method 4: Automated Local Scheduling

### Option A: Using `node-cron` Package

Install:
```bash
npm install --save-dev node-cron
```

Create `scripts/local-cron-scheduler.js`:

```javascript
const cron = require('node-cron');
const http = require('http');

const PORT = process.env.PORT || 3000;
const HOST = 'localhost';
const CRON_SECRET = process.env.CRON_SECRET;

function callCronEndpoint(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: 'GET',
      headers: CRON_SECRET ? { Authorization: `Bearer ${CRON_SECRET}` } : {},
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`[${new Date().toISOString()}] ${path}:`, json.message || 'Success');
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

console.log('🕐 Local Cron Scheduler Started');
console.log('Press Ctrl+C to stop\n');

// Cart Abandonment - Every hour
cron.schedule('0 * * * *', () => {
  callCronEndpoint('/api/cron/cart-abandonment').catch(console.error);
});

// Price Alerts - Every 6 hours
cron.schedule('0 0,6,12,18 * * *', () => {
  callCronEndpoint('/api/cron/price-alerts').catch(console.error);
});

// Stock Notifications - Every hour
cron.schedule('0 * * * *', () => {
  callCronEndpoint('/api/cron/stock-notifications').catch(console.error);
});

// Pre-Orders - Daily at 8 AM
cron.schedule('0 8 * * *', () => {
  callCronEndpoint('/api/cron/pre-orders').catch(console.error);
});

// Subscriptions - Daily at 9 AM
cron.schedule('0 9 * * *', () => {
  callCronEndpoint('/api/cron/subscriptions').catch(console.error);
});

// Keep process running
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping cron scheduler...');
  process.exit(0);
});
```

Add to `package.json`:
```json
{
  "scripts": {
    "cron:scheduler": "node scripts/local-cron-scheduler.js"
  }
}
```

Run:
```bash
npm run cron:scheduler
```

### Option B: Using System Cron (Linux/Mac)

Create a script `scripts/run-cron-local.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
CRON_SECRET="${CRON_SECRET:-}"

if [ -n "$CRON_SECRET" ]; then
  HEADER="-H 'Authorization: Bearer $CRON_SECRET'"
else
  HEADER=""
fi

# Cart Abandonment
curl -s $HEADER "$BASE_URL/api/cron/cart-abandonment" > /dev/null

# Price Alerts
curl -s $HEADER "$BASE_URL/api/cron/price-alerts" > /dev/null

# Stock Notifications
curl -s $HEADER "$BASE_URL/api/cron/stock-notifications" > /dev/null

# Pre-Orders (only if needed)
# curl -s $HEADER "$BASE_URL/api/cron/pre-orders" > /dev/null

# Subscriptions (only if needed)
# curl -s $HEADER "$BASE_URL/api/cron/subscriptions" > /dev/null
```

Make executable:
```bash
chmod +x scripts/run-cron-local.sh
```

Add to crontab (edit with `crontab -e`):
```bash
# Run every hour
0 * * * * /path/to/your/project/scripts/run-cron-local.sh
```

---

## Method 5: Using Postman Collection

1. Create a new Postman collection
2. Add requests for each cron endpoint:
   - `GET http://localhost:3000/api/cron/cart-abandonment`
   - `GET http://localhost:3000/api/cron/pre-orders`
   - etc.
3. Add Authorization header if needed:
   - Type: Bearer Token
   - Token: Your CRON_SECRET
4. Save and run manually or set up a Postman monitor

---

## Quick Testing Tips

### Test Cart Abandonment with Faster Timing

For faster testing, you can temporarily modify the cron endpoint or call the send-recovery endpoint directly:

```bash
# Send emails for carts abandoned in last 5 minutes (for testing)
curl -X POST http://localhost:3000/api/cart/abandonment/send-recovery \
  -H "Content-Type: application/json" \
  -d '{"hoursSinceAbandonment": 0.083}'  # 5 minutes
```

Or create a test script that bypasses the time check entirely:

```javascript
// Test script - send email immediately
const response = await fetch('http://localhost:3000/api/cart/abandonment/send-recovery', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    abandonmentId: 'YOUR_ABANDONMENT_ID'  // Specific cart
  })
});
```

### Check CRON_SECRET Setup

If you get 401 Unauthorized errors:

1. **Check if CRON_SECRET is set**:
   ```bash
   # In your .env file
   CRON_SECRET=your_secret_here
   ```

2. **Or disable it for local testing**:
   - Comment out the auth check in the cron route temporarily
   - Or don't set CRON_SECRET in local .env

3. **Use the secret in requests**:
   ```bash
   curl -H "Authorization: Bearer your_secret_here" \
     http://localhost:3000/api/cron/cart-abandonment
   ```

---

## Recommended Setup for Local Development

1. **For Quick Testing**: Use Method 1 (curl/browser)
2. **For Regular Testing**: Use Method 2 (NPM scripts)
3. **For Automated Testing**: Use Method 3 (Node.js script)
4. **For Continuous Testing**: Use Method 4A (node-cron scheduler)

---

## Troubleshooting

### Server Not Running
**Error**: `ECONNREFUSED` or connection error

**Solution**: Make sure your dev server is running:
```bash
npm run dev
```

### 401 Unauthorized
**Error**: `{"error": "Unauthorized"}`

**Solution**: Either:
- Set `CRON_SECRET` in your request header
- Or remove/comment out the CRON_SECRET check for local development

### No Results
**Error**: Cron runs but shows 0 results

**Solution**: 
- Check if you have test data in database
- Verify database connection
- Check cron job logic for specific requirements

---

## Example: Testing Cart Abandonment End-to-End

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Create abandoned cart** (as customer):
   - Add items to cart
   - View cart page
   - Leave without checkout

3. **Wait a few minutes**, then manually update timestamp in DB (for faster testing):
   ```javascript
   // In MongoDB
   db.cartabandonments.updateOne(
     { _id: ObjectId("YOUR_ID") },
     { $set: { lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000) } }
   )
   ```

4. **Run cron manually**:
   ```bash
   curl http://localhost:3000/api/cron/cart-abandonment
   ```

5. **Check email** or database:
   ```javascript
   db.cartabandonments.findOne({ _id: ObjectId("YOUR_ID") })
   // Should show emailSent: true
   ```

---

**Quick Reference**: The cron endpoints are just GET requests to API routes - you can call them any time your server is running!

