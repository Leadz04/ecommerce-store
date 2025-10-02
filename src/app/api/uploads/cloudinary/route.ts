import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

function parseCloudinaryUrl(url?: string) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const apiKey = u.username;
    const apiSecret = u.password;
    const cloudName = u.hostname;
    return { apiKey, apiSecret, cloudName };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const conf = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
    if (!conf?.apiKey || !conf?.apiSecret || !conf?.cloudName) {
      return NextResponse.json({ error: 'Invalid or missing CLOUDINARY_URL' }, { status: 500 });
    }

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const toSign = `timestamp=${timestamp}${conf.apiSecret}`;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');

    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('api_key', conf.apiKey);
    uploadForm.append('timestamp', String(timestamp));
    uploadForm.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${conf.cloudName}/image/upload`, {
      method: 'POST',
      body: uploadForm,
    });

    const data = await res.json();
    if (!res.ok || !data?.secure_url) {
      return NextResponse.json({ error: data?.error?.message || 'Upload failed' }, { status: 500 });
    }

    return NextResponse.json({ url: data.secure_url });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


