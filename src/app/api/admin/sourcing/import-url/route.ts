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

  // Extract ALL content from accordion-content class
  let description = '';
  const acc = $('.accordion-content').first();
  if (acc.length) {
    console.log('[DESCRIPTION:PARSING] Found accordion-content, extracting ALL content...');
    // Get all text content from the accordion-content, preserving structure
    description = acc.html() || acc.text() || '';
    console.log('[DESCRIPTION:PARSING] Raw HTML content length:', description.length);
    
    // Clean up the HTML and convert to readable text
    if (description.includes('<')) {
      // Convert HTML to clean text while preserving structure
      const cleanText = acc.text().replace(/\s+/g, ' ').trim();
      description = cleanText;
      console.log('[DESCRIPTION:PARSING] Cleaned text length:', description.length);
    }
    
    console.log('[DESCRIPTION:PARSING] Final description preview:', description.substring(0, 200) + '...');
  } else {
    console.log('[DESCRIPTION:PARSING] No accordion-content found');
  }

  // Fallback: paragraph block under a "Product Details" header BEFORE "Specification"
  if (!description) {
    const detailsHeader = $("*:contains('Product Details'):not(script):not(style)").filter((_, el) => /product\s+details/i.test($(el).text())).first() as any;
    if (detailsHeader.length) {
      const sectionRoot = detailsHeader.closest('.accordion-content, section, div');
      if (sectionRoot.length) {
        const paras: string[] = [];
        let collecting = false;
        sectionRoot.contents().each((_: any, node: any) => {
          if (!collecting) {
            if (node === detailsHeader[0] || $(node).find(detailsHeader).length) {
              collecting = true;
            }
            return;
          }
          const nodeText = $(node).text().trim();
          if (/^\s*specification\s*:?/i.test(nodeText) || /shipping|return|care|maintenance|size|measurement|faq/i.test(nodeText) && $(node).is('h1,h2,h3,h4,strong,div,section')) {
            return false;
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
  // Collect only product images; prioritize gallery and zoom assets
  const toAbs = (u: string) => (u?.startsWith('http') ? u : (u?.startsWith('//') ? `https:${u}` : new URL(u || '', url).toString()));
  const isBad = (u: string) => /ajax|loader|loading|placeholder|sprite/i.test(u) || /\/lib\/flags\//i.test(u) || /angellogo/i.test(u) || /images\/close/i.test(u) || /\.(gif)(:|$|\?)/i.test(u);
  const isProductImg = (u: string) => /\/product_images\//i.test(u);

  const candidates: string[] = [];
  // ProductImagesGridList (MagicZoom) anchors and nested images
  $('.ProductImagesGridList').find('a[href]').each((_, a) => {
    const href = $(a).attr('href') || '';
    if (href && isProductImg(href) && !isBad(href)) candidates.push(href);
    const inner = $(a).find('img').first();
    const src = inner.attr('data-zoom-image') || inner.attr('data-original') || inner.attr('data-src') || inner.attr('src') || '';
    if (src && isProductImg(src) && !isBad(src)) candidates.push(src);
    const srcset = inner.attr('srcset') || inner.attr('data-srcset');
    if (srcset) srcset.split(',').map(s => s.trim().split(' ')[0]).forEach((u)=>{ if (u && isProductImg(u) && !isBad(u)) candidates.push(u); });
  });
  // JSON-LD image arrays
  $('script[type="application/ld+json"]').each((_, s) => {
    try {
      const data = JSON.parse($(s).contents().text() || '{}');
      const imgs = Array.isArray(data?.image) ? data.image : (data?.image ? [data.image] : []);
      imgs.forEach((u: string) => { if (u && isProductImg(u) && !isBad(u)) candidates.push(u); });
      if (Array.isArray(data?.hasPart)) data.hasPart.forEach((p: any) => Array.isArray(p?.image) && p.image.forEach((u: string) => { if (u && isProductImg(u) && !isBad(u)) candidates.push(u); }));
    } catch {}
  });
  // Fallback: scan all imgs only if gallery empty
  if (candidates.length === 0) {
    $('img').each((_, el) => {
      const e = $(el);
      const src = e.attr('data-zoom-image') || e.attr('data-original') || e.attr('data-src') || e.attr('src') || '';
      if (src && isProductImg(src) && !isBad(src)) candidates.push(src);
      const srcset = e.attr('srcset') || e.attr('data-srcset');
      if (srcset) srcset.split(',').map(s => s.trim().split(' ')[0]).forEach((u)=>{ if (u && isProductImg(u) && !isBad(u)) candidates.push(u); });
    });
  }
  // Regex sweep backup
  try {
    const rx = String(html).match(/https?:[^\s'"()<>]+\.(?:webp|jpg|jpeg|png)/gi) || [];
    rx.forEach((u) => { if (isProductImg(u) && !isBad(u)) candidates.push(u); });
  } catch {}
  // Normalize and dedupe, prefer zoom/original over thumb
  const seen = new Set<string>();
  const ordered = candidates.sort((a,b)=>{
    const score = (u:string)=> (/(zoom|_orig|_large)/i.test(u)?3:0) + (!/(thumb|small|tiny|_s\.|_sm\.|_thumb)/i.test(u)?2:0);
    return score(b)-score(a);
  });
  const images = ordered.map(toAbs).filter(u=>{ if (seen.has(u)) return false; seen.add(u); return true; }).slice(0, 20);

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

    // Always update Product description if a product already exists with this sourceUrl
    try {
      await connectDB();
      await Product.updateOne(
        { sourceUrl: url },
        { $set: { description: scraped.description } }
      );
    } catch {}

    let createdProductId: string | null = null;
    if (alsoCreateDraftProduct) {
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
        // Update description on the existing draft as well
        await Product.updateOne({ _id: existing._id }, { $set: { description: scraped.description } });
        createdProductId = existing._id.toString();
      }
    }


    return NextResponse.json({ success: true, scrapedId: scraped._id, productId: createdProductId, parsed: { title: scraped.title, price: scraped.price, images: scraped.images, specs: scraped.specs, description: scraped.description, html } });
  } catch (error: any) {
    console.error('Sourcing import error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to import from URL' }, { status: 500 });
  }
}


