import { NextRequest, NextResponse } from 'next/server';
import { load as loadHtml } from 'cheerio';
import axios from 'axios';
import connectDB from '@/lib/mongodb';
import { getScrapedModels } from '@/models/Scraped';
import { Product } from '@/models';

function parseGenericProduct(html: string, url: string) {
  const $ = loadHtml(html);

  // Title: prefer first h1, fallback to og:title
  const title = $('h1').first().text().trim() || $('meta[property="og:title"]').attr('content') || '';
  // Price: meta itemprop/og:price/any $/digits in elements likely to be price
  const priceText = $('[itemprop="price"]').attr('content')
    || $('meta[property="product:price:amount"]').attr('content')
    || $('meta[name="price"]').attr('content')
    || $('*[class*="price" i]').first().text()
    || $('body').text();
  const priceMatch = priceText?.match(/\$?([0-9]+(?:\.[0-9]{2})?)/);
  const price = priceMatch ? parseFloat(priceMatch[1]) : undefined;

  // Try to extract rich description (ONLY the paragraph block under "Product Details" and BEFORE "Specification")
  let description = '';
  const detailsHeader = $("*:contains('Product Details'):not(script):not(style)").filter((_, el) => /product\s+details/i.test($(el).text())).first() as any;
  if (detailsHeader.length) {
    const sectionRoot = detailsHeader.closest('.accordion-content, section, div');
    if (sectionRoot.length) {
      const paras: string[] = [];
      let collecting = false;
      sectionRoot.contents().each((_: any, node: any) => {
        if (!collecting) {
          if (node === detailsHeader[0] || $(node).find(detailsHeader).length) {
            collecting = true; // start after header
          }
          return;
        }
        // Stop if we reach Specification or the next obvious section
        const nodeText = $(node).text().trim();
        if (/^\s*specification\s*:?/i.test(nodeText) || /shipping|return|care|maintenance|size|measurement|faq/i.test(nodeText) && $(node).is('h1,h2,h3,h4,strong,div,section')) {
          return false; // break .each
        }
        if ($(node).is('p') || $(node).find('p').length) {
          const ps = $(node).is('p') ? [node] : $(node).find('p').toArray();
          ps.forEach((p) => {
            const t = $(p).text().replace(/\s+/g, ' ').trim();
            if (t) paras.push(t);
          });
        }
      });
      if (paras.length) description = paras.join('\n\n');
    }
  }
  if (!description) {
    description = $('div.productDescription, .product-description, #tab-description, .description, .product-description__content, .tab-content')
      .find('p')
      .map((_, el) => $(el).text().replace(/\s+/g, ' ').trim())
      .get()
      .filter(Boolean)
      .join('\n\n')
      || $('meta[name="description"]').attr('content')
      || '';
  }
  const metaOgImage = $('meta[property="og:image"]').attr('content') || $('meta[name="og:image"]').attr('content') || $('link[rel="image_src"]').attr('href') || '';
  const images = Array.from(new Set(
    [metaOgImage,
      ...$('img').map((_, el) => $(el).attr('src') || $(el).attr('data-src') || '').get()
    ]
  ))
  .filter(Boolean)
  .map(src => src.startsWith('http') ? src : (src.startsWith('//') ? `https:${src}` : new URL(src, url).toString()))
  .filter(src => !/(spinner|loader|loading|ajax|placeholder)\b/i.test(src))
  .filter(src => !src.endsWith('.svg'))
  .slice(0, 12);

  // Basic specs parsing
  const specs: Record<string, string> = {};
  let bulletIndex = 1;
  // Prefer lists around a Specification header
  // Try to capture list items immediately after a "Specification" header
  const specHeader = $("strong:contains('Specification'), *:contains('Specification:')").filter((_, el) => /specification\s*:?/i.test($(el).text())).first();
  if (specHeader.length) {
    const container = specHeader.closest('.accordion-content, section, div');
    // Collect all subsequent sibling lists within the same container
    let reachedEnd = false;
    container.contents().each((_, node) => {
      if (reachedEnd) return;
      if (node === specHeader[0] || $(node).find(specHeader).length) {
        // start collecting from next siblings
        return;
      }
      // After header encountered, start collecting lis until another obvious section header shows up
      const textNode = $(node).text().trim();
      if (/shipping|return|care|maintenance|size|measurement|faq/i.test(textNode) && $(node).is('h1,h2,h3,h4,strong,div,section')) {
        reachedEnd = true;
        return;
      }
      if ($(node).is('ul,ol') || $(node).find('li').length) {
        $(node).find('li').each((__, li) => {
          const t = $(li).text().replace(/\s+/g, ' ').trim();
          if (!t) return;
          const ci = t.indexOf(':');
          if (ci > 0) {
            const k = t.slice(0, ci).trim();
            const v = t.slice(ci + 1).trim();
            if (k && v && !(k in specs)) specs[k] = v;
          } else {
            specs[`__bullet__${bulletIndex++}`] = t;
          }
        });
      }
    });
  }
  // Fallback: scan the whole page lists if nothing captured
  if (Object.keys(specs).length === 0) {
    $('ul li, ol li').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (!text) return;
      const ci = text.indexOf(':');
      if (ci > 0) {
        const k = text.slice(0, ci).trim();
        const v = text.slice(ci + 1).trim();
        if (k && v && !(k in specs)) specs[k] = v;
      } else if (/pocket|waist|cuff|closure|collar|lining|material|leather|color/i.test(text)) {
        specs[`__bullet__${bulletIndex++}`] = text;
      }
    });
  }

  // Also pull key highlights blocks often used on PDPs
  $('[class*="spec" i], [class*="feature" i]').find('li').each((_, el) => {
    const t = $(el).text().replace(/\s+/g, ' ').trim();
    if (!t) return;
    const [k, v] = t.includes(':') ? [t.split(':')[0], t.split(':').slice(1).join(':')] : [t.slice(0, 30) + '…', t];
    if (k && v && !specs[k]) specs[k] = v.trim();
  });

  return { title, price, description, images, specs, sourceUrl: url };
}

export async function POST(request: NextRequest) {
  try {
    const { url, alsoCreateDraftProduct = true } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    // Fetch HTML with robust headers and fallbacks
    let html = '' as string;
    try {
      const resp = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': 'https://www.google.com/',
        },
        timeout: 20000,
        maxRedirects: 5,
        validateStatus: () => true,
      });
      if (resp.status >= 200 && resp.status < 300 && typeof resp.data === 'string') {
        html = resp.data;
      } else {
        throw new Error(`Origin responded ${resp.status}`);
      }
    } catch (e) {
      // Fallback proxy fetch if origin blocks (e.g., 403)
      const proxyUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;
      const proxied = await axios.get(proxyUrl, { timeout: 20000, validateStatus: () => true });
      if (proxied.status >= 200 && proxied.status < 300 && typeof proxied.data === 'string') {
        html = proxied.data;
      } else {
        return NextResponse.json({ error: `Failed to fetch page (status ${proxied.status})` }, { status: 502 });
      }
    }

    // Save page
    const { ScrapedPage, ScrapedProduct } = await getScrapedModels();
    const page = await ScrapedPage.findOneAndUpdate(
      { url },
      { url, html, title: '', meta: {} },
      { upsert: true, new: true }
    );

    // Parse product (Angel Jackets example); if non-HTML fallback, basic meta extraction
    const isLikelyHtml = /<html[\s>]/i.test(html) || /<head[\s>]/i.test(html);
    let parsed = parseGenericProduct(html, url);
    try {
      console.log('[SOURCING:IMAGES]', Array.isArray(parsed.images) ? parsed.images : []);
    } catch {}
    try {
      console.log('[SOURCING:PARSED_FULL]', {
        url,
        title: parsed.title,
        price: parsed.price,
        description: parsed.description,
        specs: parsed.specs,
        images: parsed.images,
      });
    } catch {}
    if (!parsed.title && !isLikelyHtml) {
      // Minimal OG/meta parsing from plaintext (proxy output)
      const titleMatch = html.match(/title:\s*(.*)/i) || html.match(/#\s*(.*)/); // r.jina.ai often returns markdown-like
      const priceMatch = html.match(/\$([0-9]+(?:\.[0-9]{2})?)/);
      parsed = {
        title: titleMatch ? titleMatch[1].trim() : 'Untitled',
        price: priceMatch ? parseFloat(priceMatch[1]) : undefined,
        description: html.slice(0, 1000),
        images: [],
        specs: {},
        sourceUrl: url,
      };
    }
    const scraped = await ScrapedProduct.findOneAndUpdate(
      { sourceUrl: url },
      {
        sourceUrl: url,
        title: parsed.title || 'Untitled',
        description: parsed.description,
        price: parsed.price,
        images: parsed.images?.slice(0, 10) || [],
        specs: parsed.specs || {},
        raw: { parser: 'generic', pageId: page._id, debugSample: html.slice(0, 1000), fullHtml: html },
      },
      { upsert: true, new: true }
    );

    let createdProductId: string | null = null;
    if (alsoCreateDraftProduct) {
      await connectDB();
      const existing = await Product.findOne({ sourceUrl: url });
      if (!existing) {
        const product = await Product.create({
          name: scraped.title,
          description: scraped.description || scraped.title,
          price: scraped.price || 0,
          image: scraped.images?.[0] || '/placeholder-product.svg',
          images: scraped.images || [],
          category: 'Accessories',
          brand: 'Angel Jackets',
          rating: 0,
          reviewCount: 0,
          inStock: true,
          stockCount: 1,
          tags: ['sourced'],
          specifications: scraped.specs || {},
          isActive: false,
          sourceUrl: url,
          productType: 'sourced',
          status: 'draft',
        });
        createdProductId = product._id.toString();
      } else {
        createdProductId = existing._id.toString();
      }
    }

    // Log parsed details for debugging visibility
    console.log('[SOURCING:PARSED]', {
      url,
      title: scraped.title,
      price: scraped.price,
      images: scraped.images?.length,
      specs: scraped.specs ? Object.keys(scraped.specs).length : 0,
    });
    try {
      console.log('[SOURCING:SAVED_FULL]', {
        scrapedId: scraped._id,
        title: scraped.title,
        price: scraped.price,
        description: scraped.description,
        specs: scraped.specs,
        images: scraped.images,
        sourceUrl: scraped.sourceUrl,
      });
    } catch {}

    return NextResponse.json({ success: true, scrapedId: scraped._id, productId: createdProductId, parsed: { title: scraped.title, price: scraped.price, images: scraped.images, specs: scraped.specs, description: scraped.description, html } });
  } catch (error: any) {
    console.error('Sourcing import error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to import from URL' }, { status: 500 });
  }
}


