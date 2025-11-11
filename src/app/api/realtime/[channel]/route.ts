import { NextRequest } from 'next/server';
import { realtimeService } from '@/lib/realtime';

// GET - Server-Sent Events endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  const { channel } = await params;
  
  const stream = new ReadableStream({
    start(controller) {
      // Register client
      realtimeService.registerClient(channel, controller);
      
      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (error) {
          clearInterval(heartbeat);
        }
      }, 30000);
      
      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        realtimeService.unregisterClient(channel, controller);
        try {
          controller.close();
        } catch (error) {
          // Already closed
        }
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}

export const dynamic = 'force-dynamic';

