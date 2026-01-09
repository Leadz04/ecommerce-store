import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
    const params = await props.params;

    // Instead of proxying from the internet, we serve the models directly from the installed node_modules.
    // This works because we have @imgly/background-removal installed locally.
    // It solves DNS issues, improves performance, and works offline.

    const filePath = params.path?.join('/') || '';
    if (!filePath) {
        return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    // Securely construct the path to prevent directory traversal
    // We expect the files to be in node_modules/@imgly/background-removal/dist/
    const distDir = path.join(process.cwd(), 'node_modules', '@imgly', 'background-removal', 'dist');
    const fullPath = path.join(distDir, filePath);

    // Security check: ensure the resolved path is still within the distDir
    if (!fullPath.startsWith(distDir)) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    if (!fs.existsSync(fullPath)) {
        console.error(`[Model Proxy] File not found: ${fullPath}`);
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    try {
        const fileBuffer = fs.readFileSync(fullPath);

        // Determine content type
        let contentType = 'application/octet-stream';
        if (filePath.endsWith('.json')) contentType = 'application/json';
        else if (filePath.endsWith('.wasm')) contentType = 'application/wasm';
        else if (filePath.endsWith('.js')) contentType = 'application/javascript';
        else if (filePath.endsWith('.onnx')) contentType = 'application/octet-stream';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error: any) {
        console.error(`[Model Proxy] Error reading request file ${fullPath}:`, error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
