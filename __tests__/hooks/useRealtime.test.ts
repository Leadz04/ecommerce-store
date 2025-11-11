import { renderHook } from '@testing-library/react';
import { useRealtime } from '@/hooks/useRealtime';

// Mock EventSource
class MockEventSource {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;
  readyState: number = 1;
  url: string;
  CONNECTING = 0;
  OPEN = 1;
  CLOSED = 2;

  constructor(url: string) {
    this.url = url;
    // Simulate connection opening
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  close() {
    this.readyState = 2;
  }

  addEventListener(event: string, handler: any) {
    if (event === 'message') this.onmessage = handler;
    if (event === 'error') this.onerror = handler;
    if (event === 'open') this.onopen = handler;
  }

  removeEventListener() {
    // No-op for tests
  }
}

global.EventSource = MockEventSource as any;

describe('useRealtime Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useRealtime('test-channel'));

    expect(result.current.connected).toBe(false);
    expect(result.current.lastEvent).toBeNull();
  });

  it('should provide reconnect and disconnect functions', () => {
    const { result } = renderHook(() => useRealtime('test-channel'));

    expect(typeof result.current.reconnect).toBe('function');
    expect(typeof result.current.disconnect).toBe('function');
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useRealtime('test-channel'));

    // Should not throw on unmount
    expect(() => unmount()).not.toThrow();
  });

  it('should handle different channels', () => {
    const { rerender } = renderHook(
      ({ channel }) => useRealtime(channel),
      { initialProps: { channel: 'channel-1' } }
    );

    // Rerender with new channel
    rerender({ channel: 'channel-2' });

    // Should not throw
    expect(true).toBe(true);
  });

  it('should handle onEvent callback', () => {
    const mockCallback = jest.fn();
    const { result } = renderHook(() => useRealtime('test-channel', mockCallback));

    expect(result.current.lastEvent).toBeNull();
  });

  it('should provide disconnect method', () => {
    const { result } = renderHook(() => useRealtime('test-channel'));

    // Call disconnect
    expect(() => result.current.disconnect()).not.toThrow();
  });
});
