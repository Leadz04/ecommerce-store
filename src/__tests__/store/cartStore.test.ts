import { useCartStore } from '@/store/cartStore';
import type { Product, CartItem } from '@/types';

// Mock product data
const createMockProduct = (overrides?: Partial<Product>): Product => ({
  _id: '1',
  id: '1',
  name: 'Test Product',
  description: 'Test Description',
  price: 100,
  originalPrice: undefined,
  image: 'https://example.com/image.jpg',
  images: [],
  category: 'Men',
  brand: 'Test Brand',
  rating: 4.5,
  reviewCount: 100,
  inStock: true,
  stockCount: 10,
  tags: [],
  ...overrides,
});

const createMockCartItem = (product: Product, quantity = 1): CartItem => ({
  id: `${product._id || product.id}-default-default`,
  product,
  quantity,
  size: undefined,
  color: undefined,
});

describe('Cart Store - Discount Calculations', () => {
  beforeEach(() => {
    // Reset store before each test
    useCartStore.getState().clearCart();
    useCartStore.getState().removePromoCode();
  });

  describe('getTotalPrice() - Email Promo Discounts', () => {
    test('should use original price when email promo is applied', () => {
      const product = createMockProduct({
        price: 80, // Discounted price
        emailPromo: {
          token: 'test-token',
          discountPercent: 20,
          discountedPrice: 80,
          originalPrice: 100,
        },
      });

      useCartStore.getState().addItem(product, 1);
      const total = useCartStore.getState().getTotalPrice();

      // Should use original price (100) for calculations, not discounted (80)
      expect(total).toBe(100);
    });

    test('should use originalPrice field when no email promo', () => {
      const product = createMockProduct({
        price: 80,
        originalPrice: 100,
      });

      useCartStore.getState().addItem(product, 1);
      const total = useCartStore.getState().getTotalPrice();

      expect(total).toBe(100);
    });

    test('should use current price when no original price available', () => {
      const product = createMockProduct({
        price: 100,
      });

      useCartStore.getState().addItem(product, 1);
      const total = useCartStore.getState().getTotalPrice();

      expect(total).toBe(100);
    });

    test('should calculate correctly with multiple items and email promos', () => {
      const product1 = createMockProduct({
        _id: '1',
        id: '1',
        price: 80,
        emailPromo: {
          token: 'token1',
          discountPercent: 20,
          discountedPrice: 80,
          originalPrice: 100,
        },
      });

      const product2 = createMockProduct({
        _id: '2',
        id: '2',
        price: 50,
        originalPrice: 60,
      });

      useCartStore.getState().addItem(product1, 2);
      useCartStore.getState().addItem(product2, 1);
      const total = useCartStore.getState().getTotalPrice();

      // (100 * 2) + (60 * 1) = 260
      expect(total).toBe(260);
    });
  });

  describe('getDiscountAmount() - Promo Code Discounts', () => {
    test('should return 0 when no promo code is applied', () => {
      const product = createMockProduct({ price: 100 });
      useCartStore.getState().addItem(product, 1);

      const discount = useCartStore.getState().getDiscountAmount();
      expect(discount).toBe(0);
    });

    test('should calculate cart-wide discount from original prices', () => {
      const product1 = createMockProduct({
        _id: '1',
        id: '1',
        price: 80,
        emailPromo: {
          token: 'token1',
          discountPercent: 20,
          discountedPrice: 80,
          originalPrice: 100,
        },
      });

      const product2 = createMockProduct({
        _id: '2',
        id: '2',
        price: 50,
      });

      useCartStore.getState().addItem(product1, 1);
      useCartStore.getState().addItem(product2, 1);

      // Apply 15% cart-wide promo
      useCartStore.getState().applyPromoCode({
        token: 'cart-promo',
        discountPercent: 15,
      });

      const discount = useCartStore.getState().getDiscountAmount();
      // Subtotal: 100 + 50 = 150
      // Discount: 150 * 0.15 = 22.5
      expect(discount).toBe(22.5);
    });

    test('should calculate product-specific discount correctly', () => {
      const product1 = createMockProduct({
        _id: '1',
        id: '1',
        price: 100,
      });

      const product2 = createMockProduct({
        _id: '2',
        id: '2',
        price: 50,
      });

      useCartStore.getState().addItem(product1, 2);
      useCartStore.getState().addItem(product2, 1);

      // Apply 20% discount to product1 only
      useCartStore.getState().applyPromoCode({
        token: 'product-promo',
        discountPercent: 20,
        productId: '1',
      });

      const discount = useCartStore.getState().getDiscountAmount();
      // Only product1: 100 * 2 = 200
      // Discount: 200 * 0.20 = 40
      expect(discount).toBe(40);
    });

    test('should use original price for product-specific discount with email promo', () => {
      const product = createMockProduct({
        _id: '1',
        id: '1',
        price: 80, // Discounted by email promo
        emailPromo: {
          token: 'email-token',
          discountPercent: 20,
          discountedPrice: 80,
          originalPrice: 100,
        },
      });

      useCartStore.getState().addItem(product, 2);

      // Apply additional promo code (should use original price)
      useCartStore.getState().applyPromoCode({
        token: 'code-promo',
        discountPercent: 15,
        productId: '1',
      });

      const discount = useCartStore.getState().getDiscountAmount();
      // Uses original price: 100 * 2 = 200
      // Discount: 200 * 0.15 = 30
      expect(discount).toBe(30);
    });
  });

  describe('getFinalTotal()', () => {
    test('should calculate final total correctly with promo code', () => {
      const product = createMockProduct({ price: 100 });
      useCartStore.getState().addItem(product, 1);

      useCartStore.getState().applyPromoCode({
        token: 'test-promo',
        discountPercent: 20,
      });

      const finalTotal = useCartStore.getState().getFinalTotal();
      // 100 - (100 * 0.20) = 80
      expect(finalTotal).toBe(80);
    });

    test('should handle email promo + promo code correctly', () => {
      const product = createMockProduct({
        price: 80,
        emailPromo: {
          token: 'email-token',
          discountPercent: 20,
          discountedPrice: 80,
          originalPrice: 100,
        },
      });

      useCartStore.getState().addItem(product, 1);

      // Apply additional 10% promo code
      useCartStore.getState().applyPromoCode({
        token: 'code-promo',
        discountPercent: 10,
      });

      const finalTotal = useCartStore.getState().getFinalTotal();
      // Subtotal: 100 (original)
      // Discount: 100 * 0.10 = 10
      // Final: 100 - 10 = 90
      expect(finalTotal).toBe(90);
    });
  });

  describe('Edge Cases', () => {
    test('should handle product with originalPrice but no email promo', () => {
      const product = createMockProduct({
        price: 80,
        originalPrice: 100,
      });

      useCartStore.getState().addItem(product, 1);
      useCartStore.getState().applyPromoCode({
        token: 'test',
        discountPercent: 15,
      });

      const discount = useCartStore.getState().getDiscountAmount();
      // Uses originalPrice: 100
      // Discount: 100 * 0.15 = 15
      expect(discount).toBe(15);
    });

    test('should handle quantity > 1 correctly', () => {
      const product = createMockProduct({
        price: 80,
        emailPromo: {
          token: 'token',
          discountPercent: 20,
          discountedPrice: 80,
          originalPrice: 100,
        },
      });

      useCartStore.getState().addItem(product, 3);
      useCartStore.getState().applyPromoCode({
        token: 'test',
        discountPercent: 10,
      });

      const discount = useCartStore.getState().getDiscountAmount();
      // Original price: 100 * 3 = 300
      // Discount: 300 * 0.10 = 30
      expect(discount).toBe(30);

      const finalTotal = useCartStore.getState().getFinalTotal();
      // 300 - 30 = 270
      expect(finalTotal).toBe(270);
    });

    test('should handle multiple products with different discount scenarios', () => {
      const product1 = createMockProduct({
        _id: '1',
        id: '1',
        price: 80,
        emailPromo: {
          token: 'token1',
          discountPercent: 20,
          discountedPrice: 80,
          originalPrice: 100,
        },
      });

      const product2 = createMockProduct({
        _id: '2',
        id: '2',
        price: 50,
        originalPrice: 60,
      });

      const product3 = createMockProduct({
        _id: '3',
        id: '3',
        price: 30,
      });

      useCartStore.getState().addItem(product1, 1);
      useCartStore.getState().addItem(product2, 2);
      useCartStore.getState().addItem(product3, 1);

      useCartStore.getState().applyPromoCode({
        token: 'cart-wide',
        discountPercent: 15,
      });

      const subtotal = useCartStore.getState().getTotalPrice();
      // 100 + (60*2) + 30 = 250
      expect(subtotal).toBe(250);

      const discount = useCartStore.getState().getDiscountAmount();
      // 250 * 0.15 = 37.5
      expect(discount).toBe(37.5);

      const finalTotal = useCartStore.getState().getFinalTotal();
      // 250 - 37.5 = 212.5
      expect(finalTotal).toBe(212.5);
    });

    test('should handle rounding correctly', () => {
      const product = createMockProduct({ price: 99.99 });
      useCartStore.getState().addItem(product, 1);

      useCartStore.getState().applyPromoCode({
        token: 'test',
        discountPercent: 15.5, // Decimal discount
      });

      const discount = useCartStore.getState().getDiscountAmount();
      // 99.99 * 0.155 = 15.49845
      expect(discount).toBeCloseTo(15.49845, 5);

      const finalTotal = useCartStore.getState().getFinalTotal();
      // 99.99 - 15.49845 = 84.49155
      expect(finalTotal).toBeCloseTo(84.49155, 5);
    });
  });

  describe('Integration Tests', () => {
    test('complete flow: add items, apply promo, verify totals', () => {
      // Add products
      const product1 = createMockProduct({
        _id: '1',
        id: '1',
        price: 80,
        emailPromo: {
          token: 'email1',
          discountPercent: 20,
          discountedPrice: 80,
          originalPrice: 100,
        },
      });

      const product2 = createMockProduct({
        _id: '2',
        id: '2',
        price: 50,
      });

      useCartStore.getState().addItem(product1, 2);
      useCartStore.getState().addItem(product2, 1);

      // Verify initial totals
      let subtotal = useCartStore.getState().getTotalPrice();
      expect(subtotal).toBe(250); // (100*2) + 50

      // Apply promo code
      useCartStore.getState().applyPromoCode({
        token: 'cart-promo',
        discountPercent: 10,
      });

      // Verify discount
      const discount = useCartStore.getState().getDiscountAmount();
      expect(discount).toBe(25); // 250 * 0.10

      // Verify final total
      const finalTotal = useCartStore.getState().getFinalTotal();
      expect(finalTotal).toBe(225); // 250 - 25

      // Remove promo code
      useCartStore.getState().removePromoCode();
      const discountAfterRemoval = useCartStore.getState().getDiscountAmount();
      expect(discountAfterRemoval).toBe(0);
    });
  });
});

