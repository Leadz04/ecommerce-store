# Test Case 2 Troubleshooting: Men → Leather → Engine

## Issue: 0 Results Found

**Filters Applied:**
- Category: Men
- Type: Leather  
- Brand: engine

## Possible Causes & Solutions

### 1. **ProductType "Leather" Issue**

**Problem**: The productType filter uses partial matching, so "Leather" should match "Leather Jacket", "Leather Belts", etc. However, there might not be products with:
- Category = "Men" 
- productType containing "Leather"
- Brand = "engine" (or "ENGINE")

**Solution**: Try these alternatives:

#### Option A: Use More Specific ProductType
Instead of "Leather", try:
- `Men Jackets` (then search for leather in name/description)
- `Jacket` (broader, will include leather jackets)
- `Men Shirts` (if looking for leather shirts)

#### Option B: Use Search Instead of ProductType
1. Select Category: `Men`
2. Select Brand: `ENGINE` (try uppercase)
3. Use Search bar: type `leather`
4. This will find products with "leather" in name, description, or tags

#### Option C: Remove ProductType Filter
1. Select Category: `Men`
2. Select Brand: `ENGINE`
3. Use Search: `leather jacket` or just `leather`
4. This gives you more flexibility

### 2. **Brand Name Case Sensitivity**

**Problem**: Brand might be stored as "ENGINE" (uppercase) but you selected "engine" (lowercase)

**Solution**: 
- The filter is case-insensitive, so "engine" should match "ENGINE"
- But try selecting "ENGINE" from the brand list if it appears
- Check the console logs for similar brand names

### 3. **No Products Match All Three Criteria**

**Problem**: There might simply be no products that match:
- Men category
- Leather productType (or containing "leather")
- ENGINE brand

**Solution**: Test filters individually:

#### Test Step by Step:
1. **First**: Select only `Men` category
   - Check: How many products?
   - Expected: Should show many products

2. **Second**: Add Brand `ENGINE` (keep Men selected)
   - Check: How many products?
   - Expected: Should show ENGINE men's products

3. **Third**: Use Search bar with `leather`
   - Check: How many products?
   - Expected: Should show ENGINE men's products with "leather" in name/description

4. **Alternative**: Instead of ProductType filter, use Tags
   - Select Category: `Men`
   - Select Brand: `ENGINE`
   - Check Tag: `leather` (if available in tags)

## Recommended Test Flow

### Test 1: Basic Men + ENGINE
```
1. Main Category: Men
2. Brand: ENGINE
```
**Expected**: Should show ENGINE men's products

### Test 2: Men + ENGINE + Search
```
1. Main Category: Men
2. Brand: ENGINE
3. Search: "leather"
```
**Expected**: Should show ENGINE men's products containing "leather"

### Test 3: Men + Jacket Type
```
1. Main Category: Men
2. Product Type: Jacket (or "Men Jackets")
3. Brand: ENGINE
```
**Expected**: Should show ENGINE men's jackets (may include leather jackets)

### Test 4: Men + Leather in Tags
```
1. Main Category: Men
2. Brand: ENGINE
3. Tags: Check "leather" tag (if available)
```
**Expected**: Should show ENGINE men's products tagged with leather

## Debugging Steps

1. **Check Browser Console**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for `[brand-products API]` logs
   - These show:
     - How many products match each filter individually
     - Sample productTypes that match
     - Similar brand names

2. **Check Network Tab**
   - Open DevTools → Network tab
   - Filter by "brand-products"
   - Click on the request
   - Check Response tab
   - Look at `facets` to see available options

3. **Check Active Filters**
   - Verify filters are applied correctly
   - Check URL parameters match your selections

## Alternative Test Combinations

### If "Leather" ProductType doesn't exist:

**Try these ProductTypes instead:**
- `Men Jackets` - Most common
- `Jacket` - Broader match
- `Men Shirts` - If looking for leather shirts
- `Men Apparel` - Very broad

**Then use Search for "leather"**

### If Brand "engine" doesn't work:

**Try:**
- `ENGINE` (uppercase)
- Check the brand list in sidebar - see what's actually available
- The brand might be stored differently in database

## Quick Fix Actions

1. ✅ **Clear all filters** (click "Clear All")
2. ✅ **Select only "Men"** - verify products show
3. ✅ **Add "ENGINE" brand** - verify products narrow down
4. ✅ **Use Search: "leather"** - instead of ProductType filter
5. ✅ **Check console logs** - see what's actually in database

## Expected ProductTypes for Men's Leather Items

Based on the data analysis, common productTypes that might contain leather:
- `Men Jackets`
- `Jacket`
- `Men Apparel`
- `Men Shirts` (less likely for leather)

**Note**: "Leather" as a standalone productType might not exist. Products are usually categorized as "Leather Jacket", "Leather Belts", etc.

## Success Criteria

✅ **Test passes if:**
- You can filter Men → ENGINE → and find leather-related products
- Either through ProductType filter OR Search filter
- Results show relevant products

❌ **Test fails if:**
- No products show even with just Men + ENGINE
- This means there might be a data issue or brand name mismatch

---

**Next Steps:**
1. Try the recommended test flows above
2. Check console logs for diagnostic info
3. Use Search instead of ProductType if needed
4. Report what you find!

