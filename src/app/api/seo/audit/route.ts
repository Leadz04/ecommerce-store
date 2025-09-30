import { NextRequest, NextResponse } from 'next/server';
import ogs from 'open-graph-scraper';
import psi from 'psi';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    if (!url) return NextResponse.json({ success: false, error: 'Missing url' }, { status: 400 });

    const ogPromise = ogs({ url, fetchOptions: { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' } } })
      .then((res: any) => res.result)
      .catch((e: any) => ({ error: String(e) }));
    const psiPromise = psi(url, { nokey: 'true', strategy: 'mobile' }).catch((e: any) => ({ error: String(e) }));

    let [og, psiRes] = await Promise.all([ogPromise, psiPromise]);

    // Fallback: if OG missing, fetch HTML and parse title/description manually
    if (!og || (!og.ogTitle && !og.twitterTitle)) {
      try {
        const html = await axios.get(url, {
          headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' }
        }).then(r => r.data);
        const $ = cheerio.load(html);
        const meta = (name: string) => $(`meta[name="${name}"]`).attr('content') || $(`meta[property="${name}"]`).attr('content');
        og = og || {} as any;
        (og as any).ogTitle = meta('og:title') || $('title').text() || undefined;
        (og as any).ogDescription = meta('og:description') || meta('description') || undefined;
        const ogImage = meta('og:image');
        if (ogImage) (og as any).ogImage = { url: ogImage };
      } catch (e) {
        // ignore
      }
    }

    const lighthouse = (psiRes as any)?.data?.lighthouseResult;
    const categories = lighthouse?.categories;

    return NextResponse.json({
      success: true,
      url,
      og: {
        title: og?.ogTitle || og?.twitterTitle,
        description: og?.ogDescription || og?.twitterDescription,
        image: og?.ogImage?.url || og?.twitterImage?.url,
        siteName: og?.ogSiteName,
      },
      psi: {
        performance: categories?.performance?.score ?? null,
        seo: categories?.seo?.score ?? null,
        accessibility: categories?.accessibility?.score ?? null,
        bestPractices: categories?.['best-practices']?.score ?? null,
      }
    });
  } catch (error) {
    console.error('[API] /api/seo/audit error', error);
    return NextResponse.json({ success: false, error: 'Failed to audit url' }, { status: 500 });
  }
}

