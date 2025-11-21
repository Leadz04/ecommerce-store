import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

const BASE_FOLDER = 'EverStyleCrafts';

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

function sanitizeSlug(text?: string | null) {
  if (!text) return 'product';
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase() || 'product';
}

function buildFolder(folderRaw: FormDataEntryValue | null, slug: string) {
  if (typeof folderRaw === 'string' && folderRaw.trim()) {
    const withoutBase = folderRaw.replace(new RegExp(`^${BASE_FOLDER}/`, 'i'), '');
    const folderSlug = sanitizeSlug(withoutBase);
    return `${BASE_FOLDER}/${folderSlug}`;
  }
  return `${BASE_FOLDER}/${slug}`;
}

function buildPublicId(publicIdRaw: FormDataEntryValue | null, slug: string) {
  if (typeof publicIdRaw === 'string' && publicIdRaw.trim()) {
    return publicIdRaw
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase();
  }
  return `${slug}-view-${Date.now()}`;
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

    const productName = typeof form.get('product_name') === 'string' ? form.get('product_name') : '';
    const productSlug = sanitizeSlug(productName);
    const folder = buildFolder(form.get('folder'), productSlug);
    const publicId = buildPublicId(form.get('public_id'), productSlug);

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign: Record<string, string> = {
      folder,
      public_id: publicId,
      timestamp: String(timestamp),
    };
    const sortedSignatureString = Object.keys(paramsToSign)
      .sort()
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join('&');
    const toSign = `${sortedSignatureString}${conf.apiSecret}`;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');

    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('api_key', conf.apiKey);
    uploadForm.append('timestamp', String(timestamp));
    uploadForm.append('folder', folder);
    uploadForm.append('public_id', publicId);
    uploadForm.append('signature', signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${conf.cloudName}/image/upload`, {
      method: 'POST',
      body: uploadForm,
    });

    const data = await res.json();
    if (!res.ok || !data?.secure_url) {
      return NextResponse.json({ error: data?.error?.message || 'Upload failed' }, { status: 500 });
    }

    return NextResponse.json({ url: data.secure_url, folder, publicId });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


