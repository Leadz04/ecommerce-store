import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { generateFAQsForProducts } from '@/lib/generate-faqs-gemini';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (type: 'log' | 'error' | 'complete', message: string, exitCode?: number) => {
          const sseData = `data: ${JSON.stringify({ type, message, exitCode })}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        };

        try {
          await generateFAQsForProducts((type, message) => {
            send(type, message);
          });
          send('complete', 'FAQ generation completed', 0);
        } catch (error: any) {
          send('error', error?.message || 'Unknown error');
          send('complete', 'FAQ generation failed', 1);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('No token provided') || error.message.includes('Invalid token'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to run FAQ generation script', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

