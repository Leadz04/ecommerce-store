/**
 * Tests for checkout page calculation logic
 * These tests verify the calculateTotals function logic
 */

describe('Checkout Calculations', () => {
  // Mock the calculation logic from checkout page
  const calculateTotals = (
    getTotalPrice: () => number,
    getDiscountAmount: () => number
  ) => {
    const subtotal = getTotalPrice();
    const discount = Math.min(getDiscountAmount(), subtotal);
    const discountedSubtotal = Math.max(subtotal - discount, 0);
    const shipping = discountedSubtotal > 100 ? 0 : 9.99;
    const tax = discountedSubtotal * 0.08;
    const total = discountedSubtotal + shipping + tax;

    return { subtotal, discount, shipping, tax, total };
  };

  describe('Shipping Calculation', () => {
    test('should apply free shipping when discounted subtotal > $100', () => {
      const getTotalPrice = () => 150;
      const getDiscountAmount = () => 0;

      const { shipping } = calculateTotals(getTotalPrice, getDiscountAmount);
      expect(shipping).toBe(0);
    });

    test('should charge shipping when discounted subtotal <= $100', () => {
      const getTotalPrice = () => 95;
      const getDiscountAmount = () => 0;

      const { shipping } = calculateTotals(getTotalPrice, getDiscountAmount);
      expect(shipping).toBe(9.99);
    });

    test('should use discounted subtotal for shipping calculation', () => {
      const getTotalPrice = () => 110; // Original subtotal
      const getDiscountAmount = () => 15; // Discount

      const { shipping } = calculateTotals(getTotalPrice, getDiscountAmount);
      // Discounted: 110 - 15 = 95, so shipping applies
      expect(shipping).toBe(9.99);
    });

    test('should apply free shipping after discount if discounted total > $100', () => {
      const getTotalPrice = () => 120;
      const getDiscountAmount = () => 15;

      const { shipping } = calculateTotals(getTotalPrice, getDiscountAmount);
      // Discounted: 120 - 15 = 105, so free shipping
      expect(shipping).toBe(0);
    });
  });

  describe('Tax Calculation', () => {
    test('should calculate tax on discounted subtotal', () => {
      const getTotalPrice = () => 100;
      const getDiscountAmount = () => 20;

      const { tax } = calculateTotals(getTotalPrice, getDiscountAmount);
      // Discounted: 100 - 20 = 80
      // Tax: 80 * 0.08 = 6.4
      expect(tax).toBe(6.4);
    });

    test('should calculate 8% tax correctly', () => {
      const getTotalPrice = () => 100;
      const getDiscountAmount = () => 0;

      const { tax } = calculateTotals(getTotalPrice, getDiscountAmount);
      expect(tax).toBe(8);
    });
  });

  describe('Total Calculation', () => {
    test('should calculate total correctly with all components', () => {
      const getTotalPrice = () => 100;
      const getDiscountAmount = () => 10;

      const { total } = calculateTotals(getTotalPrice, getDiscountAmount);
      // Subtotal: 100
      // Discount: 10
      // Discounted: 90
      // Shipping: 9.99 (90 < 100)
      // Tax: 90 * 0.08 = 7.2
      // Total: 90 + 9.99 + 7.2 = 107.19
      expect(total).toBeCloseTo(107.19, 2);
    });

    test('should handle free shipping scenario', () => {
      const getTotalPrice = () => 120;
      const getDiscountAmount = () => 10;

      const { total } = calculateTotals(getTotalPrice, getDiscountAmount);
      // Discounted: 110
      // Shipping: 0 (110 > 100)
      // Tax: 110 * 0.08 = 8.8
      // Total: 110 + 0 + 8.8 = 118.8
      expect(total).toBeCloseTo(118.8, 2);
    });
  });

  describe('Edge Cases', () => {
    test('should prevent discount from exceeding subtotal', () => {
      const getTotalPrice = () => 50;
      const getDiscountAmount = () => 100; // Discount larger than subtotal

      const result = calculateTotals(
        getTotalPrice,
        getDiscountAmount
      );
      expect(result.discount).toBe(50); // Capped at subtotal
      // discountedSubtotal is not returned, but we can verify it's 0 via total calculation
      expect(result.total).toBeCloseTo(9.99, 2); // shipping only when subtotal is 0
    });

    test('should handle zero subtotal', () => {
      const getTotalPrice = () => 0;
      const getDiscountAmount = () => 0;

      const { subtotal, discount, shipping, tax, total } = calculateTotals(
        getTotalPrice,
        getDiscountAmount
      );
      expect(subtotal).toBe(0);
      expect(discount).toBe(0);
      expect(shipping).toBe(9.99);
      expect(tax).toBe(0);
      expect(total).toBe(9.99);
    });

    test('should handle exact $100 threshold', () => {
      const getTotalPrice = () => 100;
      const getDiscountAmount = () => 0;

      const { shipping } = calculateTotals(getTotalPrice, getDiscountAmount);
      // Exactly $100, so shipping applies (threshold is > 100)
      expect(shipping).toBe(9.99);
    });

    test('should handle $100.01 threshold', () => {
      const getTotalPrice = () => 100.01;
      const getDiscountAmount = () => 0;

      const { shipping } = calculateTotals(getTotalPrice, getDiscountAmount);
      expect(shipping).toBe(0);
    });
  });
});

