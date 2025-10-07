import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Minimal proxy to HF Router fal-ai hunyuan image text-to-image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = {
      sync_mode: body?.sync_mode ?? true,
      prompt: body?.prompt ?? '"Astronaut riding a horse"',
      ...body,
    };

    const token = process.env.huggingFaceAccessToken;
    if (!token) {
      return NextResponse.json({ error: 'huggingFaceAccessToken missing' }, { status: 500 });
    }

    const hfRes = await fetch(
      'https://router.huggingface.co/fal-ai/fal-ai/hunyuan-image/v3/text-to-image',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!hfRes.ok) {
      const txt = await hfRes.text();
      console.error('[enhance] HF router error', hfRes.status, txt);
      if (hfRes.status === 402 || hfRes.status === 429 || hfRes.status >= 500) {
        try {
          const base = (process.env.HF_SPACE_ENDPOINT || 'https://stabilityai-stable-diffusion.hf.space').replace(/\/$/, '');
          const endpoint = `${base}/run/predict`;
          const spaceRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: [String(payload.prompt || ''), String(body?.imageUrl || '')] }),
          });
          if (!spaceRes.ok) {
            const spaceTxt = await spaceRes.text();
            return NextResponse.json(
              {
                error: 'HF router failed and Space request failed',
                router: { status: hfRes.status, detail: txt, url: 'router.huggingface.co' },
                space: { status: spaceRes.status, detail: spaceTxt, url: endpoint },
              },
              { status: 502 }
            );
          }
          const sJson: any = await spaceRes.json();
          const data = sJson?.data;
          const imgUrl = Array.isArray(data) ? data.find((x: any) => typeof x === 'string' && x.startsWith('http')) : undefined;
          if (imgUrl) {
            const dl = await fetch(imgUrl);
            if (dl.ok) {
              const arrBuf = await dl.arrayBuffer();
              return new NextResponse(arrBuf, { status: 200, headers: { 'Content-Type': 'image/png' } });
            }
          }
          const base64Candidate = Array.isArray(data) ? data.find((x: any) => typeof x === 'string' && x.startsWith('data:image/')) : undefined;
          if (typeof base64Candidate === 'string') {
            const idx = base64Candidate.indexOf('base64,');
            const b64 = idx !== -1 ? base64Candidate.slice(idx + 7) : '';
            const bin = Buffer.from(b64, 'base64');
            return new NextResponse(bin, { status: 200, headers: { 'Content-Type': 'image/png' } });
          }
          return NextResponse.json({ error: 'Space returned no image', detail: sJson }, { status: 502 });
        } catch (fallbackErr: any) {
          return NextResponse.json(
            {
              error: 'HF router failed and Space fallback errored',
              router: { status: hfRes.status, detail: txt },
              spaceError: String(fallbackErr?.message || fallbackErr),
            },
            { status: 502 }
          );
        }
      }
      return NextResponse.json(
        { error: 'HF router request failed', status: hfRes.status, detail: txt },
        { status: 502 }
      );
    }

    const contentType = hfRes.headers.get('content-type') || 'image/png';
    const arr = await hfRes.arrayBuffer();
    return new NextResponse(arr, {
      status: 200,
      headers: { 'Content-Type': contentType },
    });
  } catch (e: any) {
    console.error('[enhance] exception', e);
    return NextResponse.json({ error: 'Unhandled error', detail: String(e?.message || e) }, { status: 500 });
  }
}
