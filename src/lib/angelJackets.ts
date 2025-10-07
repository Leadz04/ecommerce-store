import axios from 'axios';
import * as cheerio from 'cheerio';
import { scrapeCategory, ScrapedProduct } from './categoryScraper';

export type CategoryLink = {
  section: 'Men' | 'Women' | 'Unknown';
  label: string;
  url: string;
};

export async function loadHtml(input: { html?: string; url?: string }): Promise<{ baseUrl: string; html: string }>{
  if (input.html && input.html.trim()) {
    const baseUrl = input.url || 'https://www.angeljackets.com/';
    return { baseUrl, html: input.html };
  }
  if (input.url) {
    const resp = await axios.get(input.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 20000,
    });
    return { baseUrl: input.url, html: String(resp.data || '') };
  }
  throw new Error('Provide either html or url');
}

function toAbs(base: string, href?: string | null): string | null {
  if (!href) return null;
  try { return new URL(href, base).toString(); } catch { return null; }
}

export function extractCategoryLinks(html: string, baseUrl: string): CategoryLink[] {
  const $ = cheerio.load(html);
  const links: CategoryLink[] = [];

  // Heuristics: look for menu blocks under Men/Women and "View All" or collection links
  const menBlocks = $("*:contains('Men')").filter((_, el) => /\bMen\b/i.test($(el).text())).toArray();
  const womenBlocks = $("*:contains('Women')").filter((_, el) => /\bWomen\b/i.test($(el).text())).toArray();

  const scan = (nodes: cheerio.Element[], section: 'Men' | 'Women') => {
    for (const n of nodes) {
      const scope = $(n).closest('nav, .menu, .dropdown, .flyout, .mega, ul, .container').first().length ? $(n).closest('nav, .menu, .dropdown, .flyout, .mega, ul, .container').first() : $(n).parent();
      scope.find('a').each((_, a) => {
        const $a = $(a);
        const label = $a.text().trim();
        const href = $a.attr('href');
        const abs = toAbs(baseUrl, href);
        if (!abs) return;
        // Accept obvious collection/category links and explicit View All
        const isViewAll = /view\s*all/i.test(label);
        const looksCategory = /\/categories\//i.test(abs);
        if (isViewAll || looksCategory) {
          links.push({ section, label: label || 'Collection', url: abs });
        }
      });
    }
  };

  scan(menBlocks as any, 'Men');
  scan(womenBlocks as any, 'Women');

  // Deduplicate
  const seen = new Set<string>();
  const unique = links.filter(l => {
    const key = `${l.section}|${l.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique;
}

export async function crawlAngelJacketsCollections(input: { html?: string; url?: string; maxPagesPerCategory?: number }) {
  const { baseUrl, html } = await loadHtml(input);
  const categories = extractCategoryLinks(html, baseUrl);

  const results: Record<string, { label: string; url: string; products: ScrapedProduct[] }> = {};
  const seenProductUrls = new Set<string>();
  const seenTitlesByGroup: Record<string, Set<string>> = {};

  const maxPages = input.maxPagesPerCategory ?? 1;
  for (const [idx, cat] of categories.entries()) {
    const groupKey = `${cat.section}:${cat.url}`;
    try {
      const { products } = await scrapeCategory(cat.url, { maxPages });
      // Deduplicate by product URL across all categories
      const uniqueByUrl = products.filter(p => {
        if (!p.url) return false;
        if (seenProductUrls.has(p.url)) return false;
        seenProductUrls.add(p.url);
        return true;
      });
      // Deduplicate by title within the same category group (allow same title in different categories)
      if (!seenTitlesByGroup[groupKey]) seenTitlesByGroup[groupKey] = new Set<string>();
      const titleSet = seenTitlesByGroup[groupKey];
      const uniqueByTitle = uniqueByUrl.filter(p => {
        const normTitle = (p.title || '').trim().replace(/\s+/g, ' ').toLowerCase();
        if (!normTitle) return true;
        if (titleSet.has(normTitle)) return false;
        titleSet.add(normTitle);
        return true;
      });

      results[groupKey] = { label: cat.label, url: cat.url, products: uniqueByTitle };
    } catch (e: any) {
      results[groupKey] = { label: cat.label, url: cat.url, products: [] };
    }
  }

  return { countCategories: categories.length, categories, results };
}


