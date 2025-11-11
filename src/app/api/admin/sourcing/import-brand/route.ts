import { NextRequest, NextResponse } from 'next/server';
import { getSourcedProductModel } from '@/models/SourcedProduct';
import { fetchAndParseProduct, parseGenericProduct } from '@/lib/productParser';
import axios from 'axios';
import { load as loadHtml } from 'cheerio';

export const dynamic = 'force-dynamic';

/**
 * Normalize title for duplicate detection
 * - Convert to lowercase
 * - Remove extra whitespace
 * - Remove special characters (keep alphanumeric and spaces)
 * - Trim
 */
function normalizeTitleForDedup(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
    .replace(/\s+/g, ' ') // Clean up any remaining multiple spaces
    .trim();
}

function normalizeBrandName(raw: string | undefined | null, fallback: string): string {
  const candidate = (raw ?? '').trim();
  if (!candidate) return fallback;
  return candidate
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function sanitizeSlug(raw: string | undefined | null, defaultSlug = 'manual'): string {
  const candidate = (raw ?? '').toString().trim();
  if (!candidate) return defaultSlug;
  return candidate
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || defaultSlug;
}

function deriveSlugFromSource(url: string | undefined | null): string {
  if (!url) return 'manual';
  try {
    const parsed = new URL(url);
    const pathSlug = parsed.pathname.split('/').filter(Boolean).join('-');
    return sanitizeSlug(pathSlug || parsed.hostname || 'manual');
  } catch {
    return sanitizeSlug(url, 'manual');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const brand = String((body?.brand || '').trim());
    const url = String((body?.url || '').trim());
    const html = String(body?.html || '');

    if (!brand) {
      return NextResponse.json({ error: 'Missing brand' }, { status: 400 });
    }
    if (!url && !html) {
      return NextResponse.json({ error: 'Provide url or html' }, { status: 400 });
    }

    const normalizedBrand = normalizeBrandName(brand, brand || 'General');

    // Parse product
    let parsed;
    if (html && html.trim()) {
      parsed = parseGenericProduct(html, url || undefined as any);
      parsed.sourceUrl = parsed.sourceUrl || url || '';
    } else if (url) {
      parsed = await fetchAndParseProduct(url);
    } else {
      return NextResponse.json({ error: 'Provide url or html' }, { status: 400 });
    }

    // Brand-specific tweaks: Lama price from `.product-block.product-block--price`
    if (!parsed.price && /lama/i.test(brand)) {
      try {
        let htmlContent = html || '';
        if (!htmlContent && parsed.sourceUrl) {
          const resp = await axios.get(parsed.sourceUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 20000,
          });
          htmlContent = String(resp.data || '');
        }
        if (htmlContent) {
          const $ = loadHtml(htmlContent);
          const t = $('.product-block.product-block--price').first().text().trim();
          const m = t.match(/([0-9]+(?:\.[0-9]{2})?)/);
          if (m) parsed.price = parseFloat(m[1]);
        }
      } catch {}
    }

    // Brand-specific tweaks: Lama product details from `.product-block.product-block--tab` (restore description/specs population)
    if (/lama/i.test(brand)) {
      try {
        let htmlContent = html || '';
        if (!htmlContent && parsed.sourceUrl) {
          const resp = await axios.get(parsed.sourceUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 20000,
          });
          htmlContent = String(resp.data || '');
        }
        if (htmlContent) {
          const $ = loadHtml(htmlContent);
          const tab = $('.product-block.product-block--tab').first();
          if (tab && tab.length) {
            // Description: prefer paragraphs inside the tab; fallback to tab text
            const paras = tab.find('p').toArray();
            const descText = paras.length
              ? paras.map((p:any)=>$(p).text().replace(/\s+/g,' ').trim()).filter(Boolean).join('\n\n')
              : tab.text().replace(/\s+/g,' ').trim();
            if (descText) parsed.description = descText;

            // Specs: extract list items from the tab only
            const specs: Record<string,string> = {};
            tab.find('li').each((idx, li) => {
              const t = $(li).text().replace(/\s+/g,' ').trim();
              if (!t) return;
              const m = t.match(/^([^:]{2,}):\s*(.+)$/);
              if (m) {
                const key = m[1].trim();
                const val = m[2].trim();
                if (key && val) specs[key] = val;
              } else {
                specs[`__bullet__${idx+1}`] = t;
              }
            });
            if (Object.keys(specs).length) parsed.specs = specs;
          }
        }
      } catch {}
    }

    // Brand-specific parsing: The Jacket Maker (Shopify)
    if (/jacket\s*maker/i.test(brand) || /thejacketmaker\./i.test(parsed.sourceUrl || url)) {
      try {
        let htmlContent = html || '';
        if (!htmlContent && (parsed.sourceUrl || url)) {
          const resp = await axios.get(parsed.sourceUrl || url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 20000,
          });
          htmlContent = String(resp.data || '');
        }
        if (htmlContent) {
          const $ = loadHtml(htmlContent);
          // Title
          const t1 = $('h1').first().text().trim();
          const t2 = $('meta[property="og:title"]').attr('content');
          if (t1 || t2) parsed.title = (t1 || t2 || '').trim();

          // Per requirements, only keep title, images, and specific specs (omit price/description)
          parsed.price = undefined;
          parsed.description = '';

          // Extract only the needed specification keys from anywhere on the page
          const allowedKeys = [
            'Outer Shell',
            'Leather Type',
            'Leather Finish',
            'Inner Shell',
            'Closure Style',
            'Collar Style',
            'Cuffs Style',
            'Inside Pockets',
            'Outside Pockets',
            'Color',
          ];
          const normalize = (s:string) => s.replace(/\s+/g,' ').trim();
          const labelRegex = new RegExp(`^(${allowedKeys.map(k=>k.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')).join('|')}):?\\s*(.+)$`, 'i');
          const specs: Record<string,string> = {};
          const pushIfMatch = (text?: string) => {
            const t = normalize(String(text||''));
            if (!t) return;
            const m = t.match(labelRegex);
            if (m) {
              const labelRaw = m[1];
              const value = normalize(m[2]);
              const canonical = allowedKeys.find(k => new RegExp('^'+k+'$', 'i').test(labelRaw)) || labelRaw;
              if (value) specs[canonical] = value;
            }
          };
          // Scan common containers: lists, definition lists, tables, generic paragraphs
          $('li, dd, dt, p, th, td, .rte, .product__description, #ProductAccordion, .accordion, .prose').each((_, el)=>{
            const txt = $(el).text();
            pushIfMatch(txt);
          });

          // Images: collect gallery and OG images
          const images: string[] = Array.isArray(parsed.images) ? parsed.images.slice() : [];
          const seen = new Set(images);
          const pushImg = (u?: string) => {
            if (!u) return;
            try { u = new URL(u, parsed.sourceUrl || url).toString(); } catch {}
            if (/ajax-loader|spinner|loading|placeholder|\.gif($|\?)/i.test(u)) return;
            if (!seen.has(u)) { seen.add(u); images.push(u); }
          };
          const og1 = $('meta[property="og:image"]').attr('content');
          const og2 = $('meta[property="og:image:secure_url"]').attr('content');
          pushImg(og1); pushImg(og2);
          $('img').each((_, el) => pushImg($(el).attr('src')));
          parsed.images = images.slice(0, 20);

          parsed.specs = specs;
        }
      } catch {}
    }

    const normalizedTitle = (parsed.title || 'Untitled').trim().replace(/\s+/g, ' ');
    const normalizedTitleForDedup = normalizeTitleForDedup(normalizedTitle);
    const slug = deriveSlugFromSource(parsed.sourceUrl || url);
    const categoryGroup = `Brand:${normalizedBrand}:${slug}`;

    const Sourced = await getSourcedProductModel();
    
    // Check for duplicate by normalized title
    const allExisting = await Sourced.find({ categoryGroup }).select('title').lean();
    const isDuplicate = allExisting.some(existing => {
      const existingNormalized = normalizeTitleForDedup(existing.title || '');
      return existingNormalized === normalizedTitleForDedup && existingNormalized.length > 0;
    });
    
    if (isDuplicate) {
      console.log(`Skipping duplicate product: "${normalizedTitle}" (already exists)`);
      return NextResponse.json({ 
        success: false, 
        error: 'Duplicate product',
        message: `Product with title "${normalizedTitle}" already exists in brand "${normalizedBrand}"`
      }, { status: 409 });
    }
    
    const doc = await Sourced.findOneAndUpdate(
      { categoryGroup, title: normalizedTitle },
      {
        title: normalizedTitle,
        sourceUrl: parsed.sourceUrl || url,
        categoryGroup,
        brand: normalizedBrand,
        price: parsed.price,
        description: parsed.description || '',
        images: Array.isArray(parsed.images) ? parsed.images.slice(0, 20) : [],
        specs: parsed.specs || {},
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, item: doc, parsed });
  } catch (error: any) {
    console.error('import-brand error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to import by brand' }, { status: 500 });
  }
}


