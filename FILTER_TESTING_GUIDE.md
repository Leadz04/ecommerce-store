# Filter Testing Guide - Brand Products

## Available Filters

1. **Main Category**: Men, Women, Kids, Accessories
2. **Category**: Specific categories (e.g., "Men", "Accessories", "Clothing")
3. **Sub Category**: Sub-categories (e.g., "Topwear", "Bottomwear")
4. **Product Type**: Most specific (e.g., "Shirts", "Jeans", "Jackets", "Heels")
5. **Brand**: Product brands (e.g., "ENGINE", "UNZE", "FURORJEANS")
6. **Vendor**: From specifications
7. **Price Range**: Min/Max price
8. **Tags**: Multiple tags (e.g., "Sale", "New In", "Winter", "Summer")
9. **In Stock**: Filter for in-stock items only
10. **On Sale**: Filter for products on sale

---

## Test Action Items - Filter Combinations

### Test Case 1: Basic Category → Product Type Flow
**Goal**: Filter Men category, then select a product type

**Steps**:
1. ✅ Navigate to `/brand-products`
2. ✅ In the sidebar, find "Main Category" section
3. ✅ Click on "Men" radio button
4. ✅ **Expected**: Products should filter to show only Men's items
5. ✅ Check the product count in the results summary
6. ✅ Scroll down to "Product Type" section
7. ✅ Click on a product type (e.g., "Jacket" or "Men Shirts")
8. ✅ **Expected**: Results should narrow down to Men's items of that specific type
9. ✅ Verify active filter pills show: "Category: Men" and "Type: [Selected Type]"

**Test Data**:
- Main Category: `Men`
- Product Type: `Jacket` or `Men Shirts` or `Men Jeans`

---

### Test Case 2: Category → Product Type → Brand
**Goal**: Progressive filtering with three levels

**Steps**:
1. ✅ Start with Test Case 1 (Men → Product Type)
2. ✅ Scroll to "Brand" section
3. ✅ Select a brand (e.g., "ENGINE" or "FURORJEANS")
4. ✅ **Expected**: Results should show only Men's items of selected type from selected brand
5. ✅ Verify all three filters appear in active filter pills
6. ✅ Check product count decreases with each filter

**Test Data**:
- Main Category: `Men`
- Product Type: `Men Shirts`
- Brand: `ENGINE`

---

### Test Case 3: Category → Product Type → Price Range
**Goal**: Filter by category, type, and price

**Steps**:
1. ✅ Select Main Category: `Men`
2. ✅ Select Product Type: `Jacket`
3. ✅ Scroll to "Price Range" section
4. ✅ Enter Min Price: `1000`
5. ✅ Enter Max Price: `5000`
6. ✅ **Expected**: Results show Men's Jackets between PKR 1,000 - 5,000
7. ✅ Try quick price buttons: Click "1K-5K"
8. ✅ **Expected**: Same result as manual entry

**Test Data**:
- Main Category: `Men`
- Product Type: `Jacket`
- Price: `1000` - `5000`

---

### Test Case 4: Category → Product Type → Tags
**Goal**: Filter by category, type, and tags (style/season)

**Steps**:
1. ✅ Select Main Category: `Men`
2. ✅ Select Product Type: `Men Shirts`
3. ✅ Scroll to "Tags" section (expand if collapsed)
4. ✅ Check "Sale" tag
5. ✅ **Expected**: Results show Men's Shirts that are on sale
6. ✅ Add another tag: Check "Winter"
7. ✅ **Expected**: Results show Men's Shirts that are on sale AND tagged with Winter
8. ✅ Verify both tags appear in active filter pills

**Test Data**:
- Main Category: `Men`
- Product Type: `Men Shirts`
- Tags: `Sale`, `Winter`

---

### Test Case 5: Category → Product Type → Brand → Tags → Price
**Goal**: Complex multi-filter combination

**Steps**:
1. ✅ Select Main Category: `Men`
2. ✅ Select Product Type: `Men Jeans`
3. ✅ Select Brand: `FURORJEANS`
4. ✅ Check Tag: `Sale`
5. ✅ Set Price Range: `2000` - `8000`
6. ✅ **Expected**: Results show Men's Jeans from FURORJEANS on sale, priced 2K-8K
7. ✅ Verify all 5 filters appear in active filter pills
8. ✅ Check product count is reasonable (not 0, not too many)

**Test Data**:
- Main Category: `Men`
- Product Type: `Men Jeans`
- Brand: `FURORJEANS`
- Tags: `Sale`
- Price: `2000` - `8000`

---

### Test Case 6: Women Category → Product Type → Sub Category
**Goal**: Test Women's category with sub-categories

**Steps**:
1. ✅ Select Main Category: `Women`
2. ✅ Select Product Type: `Heels` or `Women Apparel`
3. ✅ Scroll to "Sub Category" section
4. ✅ Select a sub-category (if available)
5. ✅ **Expected**: Results narrow down further
6. ✅ Verify filter counts update correctly

**Test Data**:
- Main Category: `Women`
- Product Type: `Heels`
- Sub Category: (if available in results)

---

### Test Case 7: Search + Filters Combination
**Goal**: Combine text search with filters

**Steps**:
1. ✅ Type in search bar: `jacket`
2. ✅ **Expected**: Results show all products with "jacket" in name/description
3. ✅ Then select Main Category: `Men`
4. ✅ **Expected**: Results show only Men's jackets
5. ✅ Add Product Type: `Jacket`
6. ✅ **Expected**: Results further narrowed

**Test Data**:
- Search: `jacket`
- Main Category: `Men`
- Product Type: `Jacket`

---

### Test Case 8: In Stock + On Sale Filters
**Goal**: Test availability filters

**Steps**:
1. ✅ Select Main Category: `Men`
2. ✅ Check "In Stock Only" checkbox
3. ✅ **Expected**: Only in-stock items shown
4. ✅ Check "On Sale" checkbox
5. ✅ **Expected**: Only in-stock items on sale shown
6. ✅ Verify both checkboxes appear in active filters

**Test Data**:
- Main Category: `Men`
- In Stock: `true`
- On Sale: `true`

---

### Test Case 9: Filter Count Updates (Faceted Search)
**Goal**: Verify filter counts update based on active filters

**Steps**:
1. ✅ Note the count for "Men Shirts" in Product Type section
2. ✅ Select Main Category: `Men`
3. ✅ **Expected**: Count for "Men Shirts" should remain same or increase
4. ✅ Select Brand: `ENGINE`
5. ✅ **Expected**: Count for "Men Shirts" should decrease (only ENGINE shirts)
6. ✅ Add Price filter: `1000` - `5000`
7. ✅ **Expected**: Count for "Men Shirts" should decrease further

**Verification**:
- Filter counts should reflect current filter state
- Counts should never be higher than total products
- Counts should decrease as more filters are added

---

### Test Case 10: Clear Filters
**Goal**: Test filter reset functionality

**Steps**:
1. ✅ Apply multiple filters (Category, Type, Brand, Price, Tags)
2. ✅ Verify active filter pills show all filters
3. ✅ Click "Clear All Filters" button
4. ✅ **Expected**: All filters cleared, all products shown
5. ✅ Verify URL parameters are cleared
6. ✅ Verify filter counts reset to global counts

---

### Test Case 11: URL State Persistence
**Goal**: Verify filters persist in URL

**Steps**:
1. ✅ Apply filters: Men → Jacket → ENGINE
2. ✅ Check browser URL: Should contain `?mainCategory=Men&productType=Jacket&brand=ENGINE`
3. ✅ Refresh the page
4. ✅ **Expected**: Filters should be restored from URL
5. ✅ Products should match the filters
6. ✅ Active filter pills should show the filters

---

### Test Case 12: Sort with Filters
**Goal**: Test sorting with active filters

**Steps**:
1. ✅ Apply filters: Men → Shirts
2. ✅ Change sort dropdown to "Price: Low to High"
3. ✅ **Expected**: Products sorted by price ascending
4. ✅ Change to "Price: High to Low"
5. ✅ **Expected**: Products sorted by price descending
6. ✅ Change to "Name: A-Z"
7. ✅ **Expected**: Products sorted alphabetically
8. ✅ Verify filters remain active during sorting

**Test Data**:
- Main Category: `Men`
- Product Type: `Men Shirts`
- Sort: `price-asc`, `price-desc`, `name-asc`

---

## Quick Test Scenarios

### Scenario A: Find Men's Jackets Under 5K
1. Main Category: `Men`
2. Product Type: `Jacket`
3. Max Price: `5000`

### Scenario B: Find Sale Items for Women
1. Main Category: `Women`
2. Tags: `Sale`
3. In Stock: `true`

### Scenario C: Find Specific Brand Products
1. Brand: `ENGINE`
2. Product Type: `Men Shirts`
3. Price: `1000` - `3000`

### Scenario D: Winter Collection
1. Tags: `Winter`
2. Main Category: `Men`
3. Product Type: (any)

---

## Expected Behaviors

### ✅ Should Work:
- Multiple filters can be applied simultaneously
- Filter counts update based on active filters (faceted search)
- Active filters show as removable pills
- URL updates with filter parameters
- Filters persist on page refresh
- "Clear All Filters" resets everything
- Sorting works with active filters
- Pagination works with filters

### ❌ Should NOT Happen:
- Filter counts should not be higher than total products
- Empty results without error message
- Filters not updating when others change
- URL not reflecting filter state
- Filters lost on page refresh

---

## Debugging Tips

### If filters don't work:
1. Check browser console for errors
2. Check Network tab for API requests
3. Verify URL parameters are correct
4. Check API response in Network tab
5. Verify product data has the fields you're filtering by

### If filter counts are wrong:
1. Check if faceted search is working
2. Verify API is calculating facets correctly
3. Check if products have the required fields populated

### If no results:
1. Try removing filters one by one
2. Check if products exist with those criteria
3. Verify filter values match database values (case-sensitive matching is case-insensitive, but spelling must match)

---

## Test Checklist

- [ ] Test Case 1: Category → Product Type
- [ ] Test Case 2: Category → Product Type → Brand
- [ ] Test Case 3: Category → Product Type → Price
- [ ] Test Case 4: Category → Product Type → Tags
- [ ] Test Case 5: Complex multi-filter
- [ ] Test Case 6: Women category with sub-categories
- [ ] Test Case 7: Search + Filters
- [ ] Test Case 8: In Stock + On Sale
- [ ] Test Case 9: Filter count updates
- [ ] Test Case 10: Clear filters
- [ ] Test Case 11: URL persistence
- [ ] Test Case 12: Sort with filters

---

## Sample Test Data Reference

### Main Categories:
- `Men` (most products)
- `Women`
- `Kids`
- `Accessories`

### Product Types (Men):
- `Men Shirts`
- `Men Jeans`
- `Men Jackets`
- `Men Graphic Tees`
- `Men Polo Shirts`
- `Men Denim Jeans`
- `Men Jogger Pants`

### Product Types (Women):
- `Heels`
- `Women Apparel`
- `Women Footwear`
- `Block Heels`
- `Flats`

### Brands:
- `ENGINE` (largest)
- `UNZE`
- `FURORJEANS`
- `ALMAS`
- `BREAKOUT`

### Tags:
- `Sale` (most common)
- `New In`
- `Winter`
- `Summer`
- `Men`
- `Women`

---

**Happy Testing! 🧪**

