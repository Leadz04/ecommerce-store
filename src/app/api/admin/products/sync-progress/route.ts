import { NextRequest, NextResponse } from 'next/server';

// In-memory store for progress tracking (in production, use Redis or database)
const progressStore = new Map<string, { current: number; total: number; status: string }>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const operationId = searchParams.get('operationId');
  
  console.log(`[progress] GET request for operationId: ${operationId}`);
  console.log(`[progress] Current progress store:`, Array.from(progressStore.entries()));
  
  if (!operationId) {
    return NextResponse.json({ error: 'Operation ID required' }, { status: 400 });
  }

  const progress = progressStore.get(operationId);
  console.log(`[progress] Found progress for ${operationId}:`, progress);
  
  if (!progress) {
    return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
  }

  return NextResponse.json(progress);
}

export async function POST(request: NextRequest) {
  const { operationId, current, total, status } = await request.json();
  
  console.log(`[progress] POST request - operationId: ${operationId}, current: ${current}, total: ${total}, status: ${status}`);
  
  if (!operationId) {
    return NextResponse.json({ error: 'Operation ID required' }, { status: 400 });
  }

  progressStore.set(operationId, { current, total, status });
  console.log(`[progress] Updated progress store:`, Array.from(progressStore.entries()));
  
  // Clean up old progress entries (older than 1 hour)
  setTimeout(() => {
    progressStore.delete(operationId);
  }, 3600000);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const operationId = searchParams.get('operationId');
  
  if (operationId) {
    progressStore.delete(operationId);
  }

  return NextResponse.json({ success: true });
}
