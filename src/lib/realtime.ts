/**
 * Real-time functionality using Server-Sent Events (SSE)
 * This provides real-time updates for inventory, orders, and analytics
 */

export type RealtimeEvent = {
  type: 'inventory_update' | 'order_created' | 'order_updated' | 'flash_sale_update' | 'low_stock_alert';
  data: any;
  timestamp: number;
};

class RealtimeService {
  private clients: Map<string, Set<ReadableStreamDefaultController>> = new Map();
  
  /**
   * Register a new SSE client
   */
  registerClient(channel: string, controller: ReadableStreamDefaultController) {
    if (!this.clients.has(channel)) {
      this.clients.set(channel, new Set());
    }
    
    this.clients.get(channel)!.add(controller);
    
    // Send initial connection confirmation
    this.sendToClient(controller, {
      type: 'connected',
      data: { channel },
      timestamp: Date.now()
    });
  }
  
  /**
   * Unregister a client
   */
  unregisterClient(channel: string, controller: ReadableStreamDefaultController) {
    const channelClients = this.clients.get(channel);
    if (channelClients) {
      channelClients.delete(controller);
      if (channelClients.size === 0) {
        this.clients.delete(channel);
      }
    }
  }
  
  /**
   * Broadcast event to all clients in a channel
   */
  broadcast(channel: string, event: Omit<RealtimeEvent, 'timestamp'>) {
    const channelClients = this.clients.get(channel);
    if (!channelClients) return;
    
    const fullEvent: RealtimeEvent = {
      ...event,
      timestamp: Date.now()
    };
    
    const deadClients: ReadableStreamDefaultController[] = [];
    
    channelClients.forEach(controller => {
      try {
        this.sendToClient(controller, fullEvent);
      } catch (error) {
        console.error('Error sending to client:', error);
        deadClients.push(controller);
      }
    });
    
    // Clean up dead connections
    deadClients.forEach(controller => {
      channelClients.delete(controller);
    });
  }
  
  /**
   * Send event to specific client
   */
  private sendToClient(controller: ReadableStreamDefaultController, event: any) {
    const encoder = new TextEncoder();
    const data = `data: ${JSON.stringify(event)}\n\n`;
    controller.enqueue(encoder.encode(data));
  }
  
  /**
   * Broadcast inventory update
   */
  broadcastInventoryUpdate(productId: string, stock: number) {
    this.broadcast('inventory', {
      type: 'inventory_update',
      data: { productId, stock }
    });
  }
  
  /**
   * Broadcast order event
   */
  broadcastOrderEvent(orderId: string, type: 'created' | 'updated', orderData: any) {
    this.broadcast('orders', {
      type: type === 'created' ? 'order_created' : 'order_updated',
      data: { orderId, ...orderData }
    });
  }
  
  /**
   * Broadcast flash sale update
   */
  broadcastFlashSaleUpdate(flashSaleId: string, data: any) {
    this.broadcast('flash-sales', {
      type: 'flash_sale_update',
      data: { flashSaleId, ...data }
    });
  }
  
  /**
   * Broadcast low stock alert
   */
  broadcastLowStockAlert(productId: string, productName: string, stock: number) {
    this.broadcast('admin', {
      type: 'low_stock_alert',
      data: { productId, productName, stock }
    });
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();

