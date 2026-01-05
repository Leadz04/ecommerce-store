import { useEffect, useState, useRef } from 'react';
import { Store, ChevronDown, RefreshCw, Plus, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEtsyDataStore } from '@/store/etsyDataStore';

interface EtsyShopSelectorProps {
  selectedShopId: string | null;
  onShopChange: (shopId: string | null) => void;
  className?: string;
  showAddButton?: boolean;
}

export default function EtsyShopSelector({
  selectedShopId,
  onShopChange,
  className = '',
  showAddButton = true,
}: EtsyShopSelectorProps) {
  const {
    shops,
    fetchShops,
    setSelectedShop,
    isLoading: loading
  } = useEtsyDataStore();

  const [isOpen, setIsOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const hasAutoSelectedRef = useRef(false);

  // Sync with store on mount
  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Auto-select logic
  useEffect(() => {
    if (loading) return;

    // If no shop selected, pick the first one (only once)
    if (!selectedShopId && !hasAutoSelectedRef.current && shops.length > 0) {
      hasAutoSelectedRef.current = true;
      const firstShop = shops[0];
      onShopChange(firstShop.shopId);
      setSelectedShop(firstShop.shopId);
    }

    // If selected shop is not in the list (e.g. disconnected or different user), clear it/pick new
    if (selectedShopId && shops.length > 0 && !shops.find(s => s.shopId === selectedShopId)) {
      onShopChange(shops[0].shopId);
      setSelectedShop(shops[0].shopId);
    } else if (selectedShopId && shops.length === 0) {
      onShopChange(null);
      setSelectedShop(null);
    }
  }, [shops, loading, selectedShopId, onShopChange, setSelectedShop]);


  const handleDisconnect = async (shopId: string, shopName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`Are you sure you want to disconnect "${shopName}"? This will stop syncing data for this shop.`)) {
      return;
    }

    try {
      setDisconnecting(shopId);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/etsy/shops?shopId=${encodeURIComponent(shopId)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect shop');
      }

      toast.success(`"${shopName}" disconnected successfully`);

      // Store update handled by re-fetching
      await fetchShops();

      // If we disconnected the selected shop, switch to another one
      if (selectedShopId === shopId) {
        const remainingShops = shops.filter(s => s.shopId !== shopId);
        const newShopId = remainingShops.length > 0 ? remainingShops[0].shopId : null;
        onShopChange(newShopId);
        setSelectedShop(newShopId);
      }

    } catch (error) {
      console.error('Error disconnecting shop:', error);
      toast.error('Failed to disconnect shop');
    } finally {
      setDisconnecting(null);
    }
  };

  const selectedShop = shops.find(s => s.shopId === selectedShopId);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}>
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Loading shops...</span>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <div className="text-sm text-gray-600">
          No shops connected. Connect your first Etsy shop to get started.
        </div>
        {showAddButton && (
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                if (!token) {
                  toast.error('Please log in to connect your Etsy shop');
                  return;
                }
                const response = await fetch('/api/etsy/auth/init', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });
                const data = await response.json();
                if (data.authUrl) {
                  window.location.href = data.authUrl;
                } else {
                  toast.error(data.error || 'Failed to initiate Etsy connection');
                }
              } catch (error) {
                toast.error('Failed to connect Etsy shop');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Connect Shop
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-3">
        {/* Shop Selector */}
        <div className="relative flex-1">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Store className="h-4 w-4 text-purple-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-900 truncate">
                {selectedShop ? selectedShop.shopName : 'Select a shop'}
              </span>
              {selectedShop && (
                <span className="text-xs text-gray-500 flex-shrink-0">
                  ({shops.length} {shops.length === 1 ? 'shop' : 'shops'})
                </span>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-auto">
                <div className="p-2">
                  {shops.map((shop) => (
                    <div
                      key={shop.shopId}
                      className={`relative group flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer transition-colors ${selectedShopId === shop.shopId
                        ? 'bg-purple-50 border border-purple-200'
                        : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      onClick={() => {
                        onShopChange(shop.shopId);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Store className={`h-4 w-4 flex-shrink-0 ${selectedShopId === shop.shopId ? 'text-purple-600' : 'text-gray-400'
                          }`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium truncate ${selectedShopId === shop.shopId ? 'text-purple-900' : 'text-gray-900'
                              }`}>
                              {shop.shopName}
                            </span>
                            {selectedShopId === shop.shopId && (
                              <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            ID: {shop.shopId}
                            {shop.lastSyncAt && (
                              <> • Last synced: {formatRelativeTime(shop.lastSyncAt.toString())}</>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDisconnect(shop.shopId, shop.shopName, e)}
                        disabled={disconnecting === shop.shopId}
                        className={`ml-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${disconnecting === shop.shopId
                          ? 'opacity-100 cursor-not-allowed'
                          : 'hover:bg-red-50'
                          }`}
                        title="Disconnect shop"
                      >
                        {disconnecting === shop.shopId ? (
                          <RefreshCw className="h-4 w-4 text-red-600 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
                {showAddButton && (
                  <div className="border-t border-gray-200 p-2">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                        try {
                          const token = localStorage.getItem('token');
                          if (!token) {
                            toast.error('Please log in to connect your Etsy shop');
                            return;
                          }
                          const response = await fetch('/api/etsy/auth/init', {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json',
                            },
                          });
                          const data = await response.json();
                          if (data.authUrl) {
                            window.location.href = data.authUrl;
                          } else {
                            toast.error(data.error || 'Failed to initiate Etsy connection');
                          }
                        } catch (error) {
                          toast.error('Failed to connect Etsy shop');
                        }
                      }}
                      className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Connect Another Shop
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Add Shop Button (if multiple shops) */}
        {showAddButton && shops.length > 0 && (
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                if (!token) {
                  toast.error('Please log in to connect your Etsy shop');
                  return;
                }
                const response = await fetch('/api/etsy/auth/init', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });
                const data = await response.json();
                if (data.authUrl) {
                  window.location.href = data.authUrl;
                } else {
                  toast.error(data.error || 'Failed to initiate Etsy connection');
                }
              } catch (error) {
                toast.error('Failed to connect Etsy shop');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Add Shop
          </button>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(dateString?: string | null) {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
}
