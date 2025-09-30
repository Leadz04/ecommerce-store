'use client';

import Link from 'next/link';

export default function SeoHelpPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">SEO Research (SerpAPI) - How It Works</h1>

      <section className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
        <p className="text-gray-700">This admin feature lets you research keywords and product cards using SerpAPI and save results into the database for later analysis.</p>
      </section>

      <section className="space-y-3 mb-8">
        <h3 className="text-lg font-semibold text-gray-900">Key Files & Components</h3>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li><code>src/lib/external-apis.ts</code>: SerpAPI wrapper methods (<code>searchKeywordsSerpAPI</code>, <code>searchProductsSerpAPI</code>) with console logs.</li>
          <li><code>src/app/api/seo/keywords/route.ts</code>: Fetches keywords, logs, saves <code>SeoQuery</code> and <code>SeoKeyword</code>.</li>
          <li><code>src/app/api/seo/products/route.ts</code>: Fetches product cards, logs, saves <code>SeoQuery</code> and <code>SeoProduct</code>.</li>
          <li><code>src/app/api/seo/save/route.ts</code>: Saves both keywords and products from the UI.</li>
          <li><code>src/models/SeoQuery.ts</code>, <code>src/models/SeoKeyword.ts</code>, <code>src/models/SeoProduct.ts</code>: MongoDB schemas.</li>
          <li><code>src/app/admin/page.tsx</code> (SEO Research tab): UI that calls these APIs and renders results.</li>
          <li><code>docs/SEO_RESEARCH_SERPAPI.md</code>: Full documentation.</li>
        </ul>
      </section>

      <section className="space-y-3 mb-8">
        <h3 className="text-lg font-semibold text-gray-900">User Flow</h3>
        <ol className="list-decimal pl-6 text-gray-700 space-y-1">
          <li>Open Admin → SEO Research.</li>
          <li>Enter a seed query and click <b>Search</b> to fetch keywords (<code>/api/seo/keywords</code>).</li>
          <li>Click <b>Products</b> to fetch product cards (<code>/api/seo/products</code>).</li>
          <li>Use <b>Decision Helper</b> to evaluate opportunities.</li>
          <li>Click <b>Save Keywords & Products to DB</b> (<code>/api/seo/save</code>).</li>
        </ol>
      </section>

      <section className="space-y-3 mb-8">
        <h3 className="text-lg font-semibold text-gray-900">Why Products Might Be Empty</h3>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li>Query too narrow or suppressed by Google; try broader terms.</li>
          <li>Quota exhausted or temporary API variance; retry later.</li>
          <li>No <code>google_shopping</code> results; fallback uses classic Google results which may still be empty.</li>
        </ul>
        <p className="text-gray-700">Check server logs for <code>[SerpAPI]</code> and <code>[API]</code> entries.</p>
      </section>

      <div className="flex gap-3">
        <Link href="/admin" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Back to Admin</Link>
        <Link href="/docs/SEO_RESEARCH_SERPAPI.md" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Read Full Docs</Link>
      </div>
    </div>
  );
}

