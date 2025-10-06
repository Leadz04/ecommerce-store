import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ProcessedImage from '@/models/ProcessedImage';
import Replicate from 'replicate';
import mime from 'mime';

// ✅ Ensure this runs in Node environment (not edge)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { productId, title, imageUrl, viewHint } = await request.json();

    if (!imageUrl || !title) {
      return NextResponse.json(
        { error: 'Missing imageUrl or title' },
        { status: 400 }
      );
    }

    // 1️⃣ Setup Gemini API
    const apiKey = process.env.REPLICATE_API_TOKEN;
    console.log('apiKey', apiKey);
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is missing' },
        { status: 500 }
      );
    }

    const promptParts: string[] = [
      'Add a human male model wearing the listed product.',
      'Match the product view or perspective (front, back, or side) visible in the original image.',
      'Use a clean, studio-like background and produce photo-realistic ecommerce quality.',
      'Maintain product color, texture, and proportions.'
    ];
    if (viewHint) promptParts.push(`The current view is: ${viewHint}.`);

    const srcRes = await fetch(imageUrl);
    if (!srcRes.ok)
      return NextResponse.json(
        { error: 'Failed to fetch source image' },
        { status: 400 }
      );

    const srcBuf = Buffer.from(await srcRes.arrayBuffer());
    const headerMime = srcRes.headers.get('content-type');
    const srcMime = headerMime || mime.getType('jpg') || 'image/jpeg';

    // 2️⃣ Generate enhanced image using Replicate (bytedance/seedream-3)
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN missing' },
        { status: 500 }
      );
    }

    const replicate = new Replicate({ auth: replicateToken });
    const prompt = promptParts.join(' ');
    let outputBuffer: Buffer | null = null;

    try {
      const input: Record<string, any> = {
        prompt,
        size: 'big',
        width: 2048,
        height: 2048,
        aspect_ratio: '1:1',
        guidance_scale: 2.5,
        image: imageUrl, // some versions may ignore this; harmless if unsupported
      };

      const result: any = await replicate.run('bytedance/seedream-3', { input });

      // Normalize common output shapes
      const toBufferFromUrl = async (u: string) => {
        const r = await fetch(u);
        if (!r.ok) return null;
        return Buffer.from(await r.arrayBuffer());
      };

      const normalize = async (out: any): Promise<Buffer | null> => {
        if (!out) return null;
        if (typeof out === 'string') {
          if (out.startsWith('http')) return await toBufferFromUrl(out);
          if (out.startsWith('data:image/')) {
            const idx = out.indexOf('base64,');
            const b64 = idx !== -1 ? out.slice(idx + 7) : '';
            return Buffer.from(b64, 'base64');
          }
          return null;
        }
        if (out?.url && typeof out.url === 'string') return await toBufferFromUrl(out.url);
        if (typeof out?.url === 'function') {
          const u = out.url();
          if (typeof u === 'string') return await toBufferFromUrl(u);
        }
        if (out?.image && typeof out.image === 'string') return await toBufferFromUrl(out.image);
        return null;
      };

      if (Array.isArray(result)) {
        for (const item of result) {
          outputBuffer = await normalize(item);
          if (outputBuffer) break;
        }
      } else {
        outputBuffer = await normalize(result);
      }
    } catch (e: any) {
      return NextResponse.json({ error: 'Replicate error', detail: String(e?.message || e) }, { status: 502 });
    }

    if (!outputBuffer) {
      return NextResponse.json({ error: 'No image returned from Replicate' }, { status: 502 });
    }

    // 3️⃣ Upload to Cloudinary
    const cloudinaryUrl = process.env.CLOUDINARY_URL || '';
    if (!cloudinaryUrl)
      return NextResponse.json(
        { error: 'CLOUDINARY_URL missing' },
        { status: 500 }
      );

    const publicId = `etsy/${slugify(title)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const urlObj = new URL(cloudinaryUrl);
    const cApiKey = urlObj.username;
    const cApiSecret = urlObj.password;
    const cloudName = urlObj.hostname.replace('.cloudinary.com', '');
    const ts = Math.floor(Date.now() / 1000);
    const toSign = `public_id=${publicId}&timestamp=${ts}${cApiSecret}`;
    const signature = await sha1(toSign);

    const uploadForm = new FormData();
    const arr = new Uint8Array(outputBuffer);
    uploadForm.append('file', new Blob([arr], { type: 'image/jpeg' }), publicId + '.jpg');
    uploadForm.append('api_key', cApiKey);
    uploadForm.append('timestamp', String(ts));
    uploadForm.append('signature', signature);
    uploadForm.append('public_id', publicId);

    const cRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: uploadForm
      }
    );

    const cData: any = await cRes.json();
    if (!cRes.ok || !cData?.secure_url) {
      return NextResponse.json(
        { error: 'Cloudinary upload failed', detail: cData?.error?.message },
        { status: 502 }
      );
    }

    // 4️⃣ Save record in MongoDB
    await connectDB();
    const doc = await ProcessedImage.create({
      productId,
      productTitle: title,
      sourceImageUrl: imageUrl,
      cloudinaryUrl: cData.secure_url,
      geminiModel: 'replicate/bytedance-seedream-3',
      geminiPrompt: prompt,
      status: 'success'
    });

    return NextResponse.json({
      success: true,
      url: cData.secure_url,
      recordId: doc._id
    });
  } catch (e: any) {
    console.error('Enhance image error:', e);
    return NextResponse.json(
      { error: 'Enhancement failed', detail: e.message },
      { status: 500 }
    );
  }
}

/* ----------------- Helper functions ----------------- */

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

async function sha1(input: string) {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-1', enc);
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
}
