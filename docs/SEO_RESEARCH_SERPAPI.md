# SEO Research (SerpAPI) - Documentation

This README explains how the SerpAPI-powered SEO research flow works in the app: setup, data model, APIs, UI usage, and best practices.

## 1) Setup

- Environment
  - Add the following to your environment (e.g., `.env.local`).
    - `SERPAPI_KEY=your_real_serpapi_key`
- Restart the dev server after changing env.

## 2) Data Models

- `SeoQuery`
  - Fields: `query` (string), `type` ('keywords' | 'products'), `resultsCount` (number), `metadata` (mixed), timestamps
  - Purpose: persists every research query with counts/metadata
- `SeoKeyword`
  - Fields: `query`, `keyword`, `searchVolume?`, `competition?` ('low'|'medium'|'high'), `difficulty?`, `source='serpapi'`, `createdAt`
  - Purpose: stores keywords returned by SerpAPI for a given query
- `SeoProduct`
  - Fields: `query`, `source`, `title`, `price?`, `originalPrice?`, `currency?`, `rating?`, `reviews?`, `thumbnail?`, `productId?`, `productApiUrl?`, timestamps
  - Purpose: stores product cards (from SerpAPI immersive products) per query

All three models are exported from `src/models/index.ts`.

## 3) Library (SerpAPI wrappers)

- File: `src/lib/external-apis.ts`
  - `SEOAPIs.searchKeywordsSerpAPI(query, limit)`
    - Calls SerpAPI Google search with `related_searches`
    - Returns normalized array of `{ keyword, searchVolume, competition, difficulty }`
    - Console logs prefixed with `[SerpAPI]`
  - `SEOAPIs.searchProductsSerpAPI(query, limit)`
    - Calls SerpAPI and extracts `immersive_products` (product cards)
    - Returns `{ title, source, price, originalPrice, rating, reviews, thumbnail, productId, productApiUrl }[]`
    - Console logs prefixed with `[SerpAPI]`
  - `SEOAPIs.getKeywordData(keyword)` – demonstration method (not required by UI), includes logs.

Notes:
- If `SERPAPI_KEY` is missing, wrappers gracefully return empty results and log a warning.

## 4) API Endpoints

- `GET /api/seo/keywords?q=...&limit=...`
  - Uses `searchKeywordsSerpAPI`
  - Saves `SeoQuery` (type: keywords) and upserts `SeoKeyword` rows
  - Returns `{ success, keywords, total }`
  - Logs: `[API] /api/seo/keywords ...`
- `GET /api/seo/products?q=...&limit=...`
  - Uses `searchProductsSerpAPI`
  - Saves `SeoQuery` (type: products) and upserts `SeoProduct` rows
  - Returns `{ success, products, total }`
  - Logs: `[API] /api/seo/products ...`
- `POST /api/seo/save`
  - Body: `{ query, keywords?: SeoKeywordLike[], products?: SeoProductLike[], metadata?: any }`
  - Saves both keywords and products and logs `SeoQuery`
  - Returns `{ success: true }` on success
  - Logs: `[API] /api/seo/save ...`

## 5) Admin UI (SEO Research Tab)

- Location: `src/app/admin/page.tsx` → Tab "SEO Research"
- Sections:
  1. Keyword Research
     - Input a seed query, click "Search" to fetch keywords (SerpAPI)
     - Results show keyword, volume, competition, difficulty
     - Export CSV button to download current keyword list
  2. Product Results
     - Click "Products" to fetch immersive product cards (SerpAPI)
     - Cards include image, title, source, price, original price (if any), rating, reviews, product API link
  3. Decision Helper
     - Guidance on evaluating niches/products (signals, cautions, recommended action)
     - Button: "Save Keywords & Products to DB" → posts to `/api/seo/save`

## 6) Quota & Performance

- Quota: you indicated 250 searches/month – use sparingly.
  - Recommended workflow:
    - Batch 3–5 seed queries per session
    - Iterate based on results; export CSV to analyze offline
- Avoid automatic background fetches to conserve quota.

## 7) Console Logging & Debugging

- Server logs include:
  - `[SerpAPI]` entries for outgoing calls
  - `[API] /api/seo/...` for request lifecycle (start/success/error)
- If no data appears:
  - Verify `SERPAPI_KEY` is set
  - Check server logs for errors
  - Ensure the dev server restarted after env changes

## 8) Extending the System

- Add more sources: you can expand `SEOAPIs` with additional providers (e.g., SE Ranking) and mirror the same patterns
- Ranking logic: introduce a scoring formula for keywords and products to prioritize opportunities
- Scheduling: save queries with timestamps and build historical trend comparisons

## 9) Security & Rate Limits

- Keep `SERPAPI_KEY` private and never expose it to the client
- Add caching/memoization if repeated queries are expected
- Consider backoff/retry strategies for intermittent API errors

## 10) Quick Test Guide

1. Set `SERPAPI_KEY` and restart the dev server
2. Open Admin → SEO Research
3. Enter a query (e.g., "handmade leather jacket") and click Search
4. Click Products to fetch product cards
5. Click "Save Keywords & Products to DB"
6. Inspect server logs for `[SerpAPI]` and `[API]` messages
7. Verify data saved in MongoDB (`SeoQuery`, `SeoKeyword`, `SeoProduct`)

---
This completes the SerpAPI SEO research integration guide.
