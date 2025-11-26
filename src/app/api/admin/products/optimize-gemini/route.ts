import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { verifyToken } from '@/lib/auth';

// Ensure this route runs on the Node.js runtime (needed for child_process and CJS require)
export const runtime = 'nodejs';

// Ensure Vercel's bundler includes @google/genai in this function's bundle
// so the spawned script can require it at runtime.
import '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const scriptPath = path.join(process.cwd(), 'scripts', 'optimize-products-gemini.js');
        
        // Spawn the script process
        const child = spawn(process.execPath, [scriptPath], {
          cwd: process.cwd(),
          env: {
            ...process.env,
            NODE_ENV: process.env.NODE_ENV ?? 'production',
          },
        });

        // Send stdout data as SSE
        child.stdout.on('data', (data) => {
          const message = data.toString();
          const sseData = `data: ${JSON.stringify({ type: 'log', message })}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        });

        // Send stderr data as SSE
        child.stderr.on('data', (data) => {
          const message = data.toString();
          const sseData = `data: ${JSON.stringify({ type: 'error', message })}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        });

        // Handle process completion
        child.on('close', (code) => {
          const sseData = `data: ${JSON.stringify({ type: 'complete', exitCode: code ?? -1 })}\n\n`;
          controller.enqueue(encoder.encode(sseData));
          controller.close();
        });

        // Handle process errors
        child.on('error', (error) => {
          const sseData = `data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`;
          controller.enqueue(encoder.encode(sseData));
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('No token provided') || error.message.includes('Invalid token'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to run optimize script', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

