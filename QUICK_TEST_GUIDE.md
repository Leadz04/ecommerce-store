# ⚡ Quick Test Guide - 5 Minutes

## Fastest Way to Verify SEO Implementation

### 1. Start Server (1 minute)
```bash
npm run dev
```

### 2. Open Product Page (1 minute)
Visit: `http://localhost:3000/products/68cb3059df8f11eb2003d2ff`

### 3. Check Schema (2 minutes)

**Option A: View Source**
- Right-click → "View Page Source"
- Press `Ctrl+F`
- Search: `faq-schema`
- ✅ Should see JSON-LD script

**Option B: DevTools**
- Press `F12`
- Elements tab → Search: `faq-schema`
- ✅ Should see script tag

### 4. Quick Validation (1 minute)

In browser console (`F12` → Console tab), run:
```javascript
// Quick check
console.log('FAQ Schema:', document.getElementById('faq-schema') ? '✅ Found' : '❌ Missing');
console.log('Product Schema:', document.getElementById('product-jsonld') ? '✅ Found' : '❌ Missing');
```

**Expected Output:**
```
FAQ Schema: ✅ Found
Product Schema: ✅ Found
```

## ✅ That's It!

If both schemas are found, your implementation is working! 

**Next Steps:**
- Deploy to production
- Test with Google Rich Results Test
- Monitor in Search Console

See `SEO_TESTING_CHECKLIST.md` for detailed testing.

