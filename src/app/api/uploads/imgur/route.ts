import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    const clientId = process.env.IMGUR_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: 'Missing IMGUR_CLIENT_ID' }, { status: 500 });
    }

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const base64 = await fileToBase64(file);

    const res = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: `Client-ID ${clientId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64, type: 'base64' }),
    });

    const data = await res.json();
    if (!res.ok || !data?.data?.link) {
      return NextResponse.json({ error: data?.data?.error || 'Upload failed' }, { status: 500 });
    }

    return NextResponse.json({ url: data.data.link });
  } catch (error) {
    console.error('Imgur upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


