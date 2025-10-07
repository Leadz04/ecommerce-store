import axios from 'axios';
import { load as loadHtml } from 'cheerio';

export type ParsedProduct = {
  title: string;
  price?: number;
  description?: string;
  images: string[];
  specs: Record<string, string>;
  sourceUrl: string;
};

export function parseGenericProduct(html: string, url: string): ParsedProduct {
  try {
    const $ = loadHtml(html);

    // Extract title
    const title = $('h1').first().text().trim() || $('meta[property="og:title"]').attr('content') || '';

    // Extract price
    const priceText = $('[itemprop="price"]').attr('content')
      || $('meta[property="product:price:amount"]').attr('content')
      || $('meta[name="price"]').attr('content')
      || $('*[class*="price" i]').first().text()
      || $('body').text();
    const priceMatch = priceText?.match(/\$?([0-9]+(?:\.[0-9]{2})?)/);
    const price = priceMatch ? parseFloat(priceMatch[1]) : undefined;

    // Extract images
    const candidates: string[] = [];
    const isBadImage = (u: string) => {
      return /ajax-loader|spinner|loading|placeholder|sprite|\.(gif)(:|$|\?)/i.test(u)
        || /\/lib\/flags\//i.test(u)
        || /angellogo/i.test(u)
        || /images\/close/i.test(u);
    };

    // Get OG images
    const og1 = $('meta[property="og:image"]').attr('content');
    const og2 = $('meta[property="og:image:secure_url"]').attr('content');
    const linkImg = $('link[rel="image_src"]').attr('href');
    
    if (og1 && !isBadImage(og1)) candidates.push(og1);
    if (og2 && !isBadImage(og2)) candidates.push(og2);
    if (linkImg && !isBadImage(linkImg)) candidates.push(linkImg);

    // Get all img elements
    $('img').each((_, el) => {
      const $el = $(el);
      const src = $el.attr('data-zoom-image') || $el.attr('data-original') || $el.attr('data-src') || $el.attr('src') || '';
      if (!src || isBadImage(src)) return;
      
      const w = parseInt($el.attr('width') || '0', 10);
      const h = parseInt($el.attr('height') || '0', 10);
      if (w && h && (w < 80 || h < 80)) return;
      
      candidates.push(src);
      
      const srcset = $el.attr('srcset') || $el.attr('data-srcset');
      if (srcset) {
        srcset.split(',').forEach(s => {
          const url = s.trim().split(' ')[0];
          if (url && !isBadImage(url)) candidates.push(url);
        });
      }
    });

    // Get product images from ProductImagesGridList
    $('.ProductImagesGridList a[href]').each((_, a) => {
      const href = $(a).attr('href');
      if (href && !isBadImage(href)) candidates.push(href);
      
      const innerImg = $(a).find('img').first().attr('src');
      if (innerImg && !isBadImage(innerImg)) candidates.push(innerImg);
    });

    // Regex sweep for product_images
    try {
      const urlMatches = String(html).match(/https?:[^\s'"()<>]+\.(?:webp|jpg|jpeg|png)/gi) || [];
      urlMatches.forEach(u => {
        if (/product_images\//i.test(u) && !isBadImage(u)) {
          candidates.push(u);
        }
      });
    } catch {}

    // Filter and sort images
    const filtered = candidates.filter(u => !isBadImage(u));
    const seen = new Set<string>();
    const images: string[] = [];

    // Simple scoring function
    function scoreImage(url: string): number {
      let points = 0;
      if (/product_images|\/products\//i.test(url)) points += 10;
      if (!/(thumb|small|tiny|min|_s\.|_sm\.|_thumb)/i.test(url)) points += 5;
      if (/(\.webp|\.jpg|\.jpeg|\.png)(:|$|\?)/i.test(url)) points += 2;
      return points;
    }

    // Sort by score
    const sorted = filtered.sort((a, b) => scoreImage(b) - scoreImage(a));

    // Add unique images
    sorted.forEach(c => {
      let abs = c;
      try {
        abs = new URL(c, url).toString();
      } catch {}
      if (!seen.has(abs)) {
        seen.add(abs);
        images.push(abs);
      }
    });

    // Extract description
    let description = '';
    const acc = $('.accordion-content').first();
    if (acc.length) {
      console.log('[DESCRIPTION:PARSING] Found accordion-content, extracting ALL content...');
      description = acc.html() || acc.text() || '';
      console.log('[DESCRIPTION:PARSING] Raw HTML content length:', description.length);
      
      if (description.includes('<')) {
        const cleanText = acc.text().replace(/\s+/g, ' ').trim();
        description = cleanText;
        console.log('[DESCRIPTION:PARSING] Cleaned text length:', description.length);
      }
      
      console.log('[DESCRIPTION:PARSING] Final description preview:', description.substring(0, 200) + '...');
    } else {
      console.log('[DESCRIPTION:PARSING] No accordion-content found');
    }

    // Fallback description
    if (!description) {
      const detailsHeader = $("*:contains('Product Details'):not(script):not(style)").filter((_, el) => /product\s+details/i.test($(el).text())).first() as any;
      if (detailsHeader.length) {
        const sectionRoot = detailsHeader.closest('section, .product, .details, .container, .wrapper');
        const paras = sectionRoot.find('p').toArray().slice(0, 12);
        description = paras.map((p: any) => $(p).text().replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n\n');
      }
    }
    if (!description) {
      description = $('meta[name="description"]').attr('content') || '';
    }

    // Extract specs
    const specs: Record<string, string> = {};
    const specTable = $('table').filter((_, t) => /spec/i.test($(t).text())).first();
    if (specTable && specTable.length) {
      specTable.find('tr').each((_, tr) => {
        const tds = $(tr).find('td');
        const key = (tds.eq(0).text() || '').replace(/\s+/g, ' ').trim();
        const val = (tds.eq(1).text() || '').replace(/\s+/g, ' ').trim();
        if (key && val) specs[key] = val;
      });
    }
    $('ul, ol').find('li').each((_, li) => {
      const t = $(li).text().replace(/\s+/g, ' ').trim();
      if (t && t.length > 2 && !Object.values(specs).includes(t)) {
        const k = 'Feature ' + (Object.keys(specs).length + 1);
        specs[k] = t;
      }
    });

    return { title, price, description, images, specs, sourceUrl: url };
  } catch (error) {
    console.error('Parse error:', error);
    return { title: '', price: undefined, description: '', images: [], specs: {}, sourceUrl: url };
  }
}

export async function fetchAndParseProduct(url: string): Promise<ParsedProduct> {
  try {
    const resp = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 25000,
    });
    const html = String(resp.data || '');
    return parseGenericProduct(html, url);
  } catch (error) {
    console.error('Fetch error:', error);
    return { title: '', price: undefined, description: '', images: [], specs: {}, sourceUrl: url };
  }
}