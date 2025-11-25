import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { CartItem, Product } from '@/types';

interface PromoCode {
  token: string;
  discountPercent: number;
  productId?: string;
}

interface StockAdjustment {
  id: string;
  name: string;
  previousQuantity: number;
  newQuantity: number;
  availableStock: number;
  removed: boolean;
}

interface CartStore {
  items: CartItem[];
  promoCode: PromoCode | null;
  addItem: (product: Product, quantity?: number, size?: string, color?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  enforceStockLimits: () => StockAdjustment[];
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  applyPromoCode: (promo: PromoCode) => void;
  removePromoCode: () => void;
  getDiscountAmount: () => number;
  getFinalTotal: () => number;
}

const normalizeCartItems = (items: CartItem[]) => {
  const map = new Map<string, CartItem>();
  for (const it of items) {
    const key = it.id;
    if (map.has(key)) {
      const existing = map.get(key)!;
      map.set(key, { ...existing, quantity: existing.quantity + it.quantity });
    } else {
      map.set(key, { ...it });
    }
  }

  const deduped = Array.from(map.values());
  const adjustments: StockAdjustment[] = [];
  const normalized: CartItem[] = [];

  for (const item of deduped) {
    const hasFiniteStock = typeof item.product.stockCount === 'number' && item.product.stockCount >= 0;
    const stockLimit = hasFiniteStock ? item.product.stockCount : null;
    const normalizedQuantity = Math.max(0, Math.floor(item.quantity || 0));

    if (stockLimit === 0) {
      adjustments.push({
        id: item.id,
        name: item.product.name,
        previousQuantity: normalizedQuantity,
        newQuantity: 0,
        availableStock: 0,
        removed: true,
      });
      continue;
    }

    let nextQuantity = normalizedQuantity;
    if (stockLimit !== null && nextQuantity > stockLimit) {
      adjustments.push({
        id: item.id,
        name: item.product.name,
        previousQuantity: normalizedQuantity,
        newQuantity: stockLimit,
        availableStock: stockLimit,
        removed: false,
      });
      nextQuantity = stockLimit;
    }

    if (nextQuantity <= 0) {
      adjustments.push({
        id: item.id,
        name: item.product.name,
        previousQuantity: normalizedQuantity,
        newQuantity: 0,
        availableStock: stockLimit ?? 0,
        removed: true,
      });
      continue;
    }

    normalized.push({ ...item, quantity: nextQuantity });
  }

  return { items: normalized, adjustments };
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,

      // Normalize cart to remove duplicates and clamp to available stock
      _normalizeItems: (items: CartItem[]) => {
        return normalizeCartItems(items).items;
      },

      addItem: (product: Product, quantity = 1, size, color) => {
        const items = get().items;
        const safeQuantity = Math.max(1, quantity);
        const hasFiniteStock = typeof product.stockCount === 'number' && product.stockCount >= 0;
        const stockLimit = hasFiniteStock ? product.stockCount : null;
        const stockErrorMessage = stockLimit === 0
          ? `${product.name} is out of stock`
          : `Only ${stockLimit} ${product.name}${stockLimit === 1 ? '' : 's'} available`;

        if (stockLimit === 0) {
          toast.error(stockErrorMessage);
          return;
        }

        const normalize = (v?: string) => (v && v.trim() !== '' ? v : 'default');
        const nSize = normalize(size);
        const nColor = normalize(color);
        const existingItemIndex = items.findIndex(
          item =>
            (item.product._id || item.product.id) === (product._id || product.id) &&
            normalize(item.size) === nSize &&
            normalize(item.color) === nColor
        );

        if (existingItemIndex > -1) {
          // Update existing item quantity
          const updatedItems = [...items];
          const existingItem = updatedItems[existingItemIndex];
          if (stockLimit !== null) {
            const availableSlots = stockLimit - existingItem.quantity;
            if (availableSlots <= 0) {
              toast.error(stockErrorMessage);
              return;
            }
            const quantityToAdd = Math.min(safeQuantity, availableSlots);
            existingItem.quantity += quantityToAdd;
            set({ items: updatedItems });
            if (quantityToAdd < safeQuantity) {
              toast.error(stockErrorMessage);
            }
          } else {
            existingItem.quantity += safeQuantity;
            set({ items: updatedItems });
          }
        } else {
          // Add new item
          const allowedQuantity = stockLimit === null ? safeQuantity : Math.min(safeQuantity, stockLimit);
          if (allowedQuantity <= 0) {
            toast.error(stockErrorMessage);
            return;
          }
          const newItem: CartItem = {
            id: `${product._id || product.id}-${nSize}-${nColor}`,
            product,
            quantity: allowedQuantity,
            size: size,
            color: color,
            price: product.price,
            appliedPromo: product.emailPromo,
          };
          // Append then dedupe to guard against any legacy duplicates
          const next = [...items, newItem];
          // @ts-ignore - internal helper
          const normalized = (get() as any)._normalizeItems(next);
          set({ items: normalized });
        }
      },

      removeItem: (itemId: string) => {
        set({ items: get().items.filter(item => item.id !== itemId) });
      },

      updateQuantity: (itemId: string, quantity: number) => {
        const normalizedQuantity = Math.floor(quantity);
        if (normalizedQuantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        const items = get().items;
        const itemIndex = items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;

        const targetItem = items[itemIndex];
        const product = targetItem.product;
        const hasFiniteStock = typeof product.stockCount === 'number' && product.stockCount >= 0;
        const stockLimit = hasFiniteStock ? product.stockCount : null;

        if (stockLimit === 0) {
          toast.error(`${product.name} is out of stock`);
          get().removeItem(itemId);
          return;
        }

        if (stockLimit !== null && normalizedQuantity > stockLimit) {
          const clamped = stockLimit;
          const updatedItems = [...items];
          updatedItems[itemIndex] = { ...targetItem, quantity: clamped };
          set({ items: updatedItems });
          toast.error(`Only ${stockLimit} ${product.name}${stockLimit === 1 ? '' : 's'} available`);
          return;
        }

        const updatedItems = [...items];
        updatedItems[itemIndex] = { ...targetItem, quantity: normalizedQuantity };
        set({ items: updatedItems });
      },

      enforceStockLimits: () => {
        const currentItems = get().items;
        const { items: normalizedItems, adjustments } = normalizeCartItems(currentItems);
        set({ items: normalizedItems });
        return adjustments;
      },

      clearCart: () => {
        set({ items: [], promoCode: null });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => {
            // Use original price if email promo is applied, otherwise use current price
            const basePrice = item.product.emailPromo?.originalPrice 
              || item.product.originalPrice 
              || item.product.price;
            return total + (basePrice * item.quantity);
          },
          0
        );
      },

      applyPromoCode: (promo: PromoCode) => {
        set({ promoCode: promo });
      },

      removePromoCode: () => {
        set({ promoCode: null });
      },

      getDiscountAmount: () => {
        const { promoCode, items } = get();
        if (!promoCode) return 0;

        // If promo is product-specific, only apply to that product
        if (promoCode.productId) {
          const applicableItems = items.filter(
            item => (item.product._id || item.product.id) === promoCode.productId
          );
          const applicableTotal = applicableItems.reduce(
            (total, item) => {
              // Use original price if email promo is applied, otherwise use current price
              const basePrice = item.product.emailPromo?.originalPrice 
                || item.product.originalPrice 
                || item.product.price;
              return total + (basePrice * item.quantity);
            },
            0
          );
          return applicableTotal * (promoCode.discountPercent / 100);
        }

        // Otherwise apply to entire cart
        const subtotal = get().getTotalPrice();
        return subtotal * (promoCode.discountPercent / 100);
      },

      getFinalTotal: () => {
        const subtotal = get().getTotalPrice();
        const discount = get().getDiscountAmount();
        return subtotal - discount;
      },
    }),
    {
      name: 'cart-storage',
      // Clean up any legacy duplicates on hydration
      onRehydrateStorage: () => (state) => {
        try {
          if (!state || !(state as any).items) return;
          // @ts-ignore - internal helper
          const normalized = (state as any)._normalizeItems((state as any).items);
          (state as any).items = normalized;
        } catch { }
      },
    }
  )
);
