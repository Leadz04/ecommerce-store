# Gemini API Integration Documentation

## Overview

The codebase uses Google Gemini AI for various AI-powered features including:
- Product optimization (titles, descriptions, tags)
- Etsy policy compliance reviews
- Product improvement suggestions
- Blog content generation

## API Key Configuration

The system supports **three API keys** with fallback mechanism:

1. **Primary Key**: `GEMINI_API_KEY` - Main production key
2. **Secondary Key**: `STAGE_GEMINI_API_KEY` - Staging/fallback key
3. **Tertiary Key**: `TEST_LEADZ07_FIRST_API_KEY` - Test/backup key

### Fallback Strategy

The system tries API keys in order:
1. First attempts with `GEMINI_API_KEY`
2. If that fails, tries `STAGE_GEMINI_API_KEY`
3. If that also fails, tries `TEST_LEADZ07_FIRST_API_KEY`
4. If all three fail, returns an error

## Where Gemini is Used

### 1. Product Optimization API
**File**: `src/app/api/ai/optimize/route.ts`
- **Purpose**: Optimizes product titles, descriptions, and tags for Etsy SEO
- **Model**: `gemini-2.5-pro`
- **Features**: Streaming responses for real-time updates
- **API Keys**: Uses all three keys with fallback

### 2. Product Improvement API
**File**: `src/app/api/products/[id]/improve/route.ts`
- **Purpose**: Provides AI-powered improvement suggestions for product listings
- **Model**: `gemini-2.5-pro` (configurable via `GEMINI_POLICY_MODEL`)
- **Features**: JSON-formatted responses with structured improvement data
- **API Keys**: Uses all three keys with fallback

### 3. Etsy Policy Review API
**File**: `src/app/api/products/[id]/check-etsy-policies/route.ts`
- **Purpose**: Reviews products for Etsy policy compliance
- **Model**: `gemini-2.5-pro` (configurable via `GEMINI_POLICY_MODEL`)
- **Features**: 
  - Analyzes listings against Etsy Seller Handbook
  - Identifies policy violations
  - Provides risk assessments
- **API Keys**: Uses all three keys with fallback

### 4. Blog Content Generation
**Files**: 
- `src/app/api/admin/blogs/ai-generate/route.ts`
- `src/app/api/admin/blogs/ai-regenerate-all/route.ts`
- **Purpose**: Generates SEO-optimized blog content
- **Model**: `gemini-2.5-pro`
- **API Keys**: Uses all three keys with fallback

### 5. Product Optimization Script
**File**: `scripts/optimize-products-gemini.js`
- **Purpose**: Batch optimization of products via command-line script
- **Model**: `gemini-2.5-pro`
- **Features**: Optimizes titles and tags in bulk
- **API Keys**: Uses all three keys with fallback

## Environment Variables

Add these to your `.env.local` file:

```env
# Primary Gemini API Key
GEMINI_API_KEY=your_primary_key_here

# Secondary/Staging Gemini API Key
STAGE_GEMINI_API_KEY=your_staging_key_here

# Tertiary/Test Gemini API Key
TEST_LEADZ07_FIRST_API_KEY=your_test_key_here

# Optional: Custom model configuration
GEMINI_POLICY_MODEL=gemini-2.5-pro
```

## API Key Priority

The system uses the following priority order:

1. **GEMINI_API_KEY** (Primary)
2. **STAGE_GEMINI_API_KEY** (Secondary)
3. **TEST_LEADZ07_FIRST_API_KEY** (Tertiary)

## Implementation Pattern

Most endpoints follow this pattern:

```typescript
const primaryKey = process.env.GEMINI_API_KEY;
const secondaryKey = process.env.STAGE_GEMINI_API_KEY;
const tertiaryKey = process.env.TEST_LEADZ07_FIRST_API_KEY;

// Try primary key first
let response = await callGemini(primaryKey);
if (!response.ok && secondaryKey) {
  // Fallback to secondary
  response = await callGemini(secondaryKey);
}
if (!response.ok && tertiaryKey) {
  // Fallback to tertiary
  response = await callGemini(tertiaryKey);
}
```

## Error Handling

When all API keys fail, the system:
- Logs detailed error information for each key attempt
- Returns appropriate HTTP status codes (502 for API failures)
- Provides error messages indicating which keys failed

## Testing API Keys

To test if an API key is working:

1. Set only that key in `.env.local`
2. Make a request to any Gemini endpoint
3. Check the response and logs

Example test:
```bash
# Test with only TEST_LEADZ07_FIRST_API_KEY
GEMINI_API_KEY=
STAGE_GEMINI_API_KEY=
TEST_LEADZ07_FIRST_API_KEY=your_test_key
```

## Model Configuration

Default model: `gemini-2.5-pro`

Can be overridden with:
- `GEMINI_POLICY_MODEL` environment variable (for policy reviews and improvements)

## Usage Examples

### Product Optimization
```typescript
POST /api/ai/optimize
{
  "mode": "title", // or "description" or "tags"
  "input": {
    "name": "Product Name",
    "description": "Product Description",
    "tags": ["tag1", "tag2"],
    "category": "Men",
    "brand": "Brand Name"
  }
}
```

### Product Improvement
```typescript
POST /api/products/[id]/improve
{
  "reviewSummary": { /* policy review data */ }
}
```

### Policy Review
```typescript
POST /api/products/[id]/check-etsy-policies
```

## Monitoring

Check logs for:
- `[Improve]` - Product improvement calls
- `[Policy Review]` - Policy review calls
- `Gemini request failed` - API key failures

## Notes

- All API keys are checked in sequence
- If a key is missing, it's skipped and the next one is tried
- The system ensures at least one key is available before making requests
- Rate limiting is handled gracefully with appropriate error messages

