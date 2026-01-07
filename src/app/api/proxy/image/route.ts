import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
        // Basic validation of the URL
        const url = new URL(imageUrl);
        if (!['http:', 'https:'].includes(url.protocol)) {
            return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 });
        }

        console.log(`[Image Proxy] Fetching: ${imageUrl}`);
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.error(`[Image Proxy] Failed to fetch: ${response.status} ${response.statusText} for ${imageUrl}`);
            return NextResponse.json({ error: `Failed to fetch image: ${response.statusText}`, status: response.status }, { status: response.status });
        }

        const contentType = response.headers.get('content-type');
        const blob = await response.blob();
        console.log(`[Image Proxy] Success: ${imageUrl} (${contentType}, ${blob.size} bytes)`);

        return new NextResponse(blob, {
            headers: {
                'Content-Type': contentType || 'image/jpeg',
                'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error: any) {
        console.error('[Image Proxy] Error:', error);
        return NextResponse.json({ error: 'Error fetching image', details: error.message }, { status: 500 });
    }
}
