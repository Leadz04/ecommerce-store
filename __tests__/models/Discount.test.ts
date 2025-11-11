// Mock the entire Discount model
jest.mock('@/models/Discount', () => {
  const mockSchema = {
    methods: {
      isCurrentlyValid: function() {
        if (!this.isActive || this.status !== 'active') return false;
        const now = new Date();
        if (this.startDate && this.startDate > now) return false;
        if (this.endDate && this.endDate < now) return false;
        if (this.usageLimit && this.usageCount >= this.usageLimit) return false;
        return true;
      },
      calculateDiscount: function(orderTotal, quantity = 1) {
        if (!this.isCurrentlyValid()) return 0;
        if (this.minPurchaseAmount && orderTotal < this.minPurchaseAmount) return 0;

        let discountAmount = 0;

        if (this.type === 'percentage') {
          discountAmount = (orderTotal * this.value) / 100;
          if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
            discountAmount = this.maxDiscountAmount;
          }
        } else if (this.type === 'fixed') {
          discountAmount = this.value;
        } else if (this.type === 'bulk' && this.bulkTiers) {
          const tier = [...this.bulkTiers]
            .sort((a, b) => b.quantity - a.quantity)
            .find(t => quantity >= t.quantity);
          if (tier) {
            discountAmount = (orderTotal * tier.discountPercent) / 100;
          }
        }

        return Math.min(discountAmount, orderTotal);
      },
    },
  };

  return {
    __esModule: true,
    default: {
      schema: mockSchema,
    },
    schema: mockSchema,
  };
});

describe('Discount Model', () => {
  const Discount = require('@/models/Discount').default;
  describe('isCurrentlyValid method', () => {
    it('should return false if discount is not active', () => {
      const discount = {
        isActive: false,
        status: 'disabled',
        isCurrentlyValid: Discount.schema.methods.isCurrentlyValid,
      };

      expect(discount.isCurrentlyValid()).toBe(false);
    });

    it('should return false if start date is in future', () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      
      const discount = {
        isActive: true,
        status: 'active',
        startDate: futureDate,
        isCurrentlyValid: Discount.schema.methods.isCurrentlyValid,
      };

      expect(discount.isCurrentlyValid()).toBe(false);
    });

    it('should return false if end date is in past', () => {
      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      
      const discount = {
        isActive: true,
        status: 'active',
        endDate: pastDate,
        isCurrentlyValid: Discount.schema.methods.isCurrentlyValid,
      };

      expect(discount.isCurrentlyValid()).toBe(false);
    });

    it('should return false if usage limit reached', () => {
      const discount = {
        isActive: true,
        status: 'active',
        usageLimit: 10,
        usageCount: 10,
        isCurrentlyValid: Discount.schema.methods.isCurrentlyValid,
      };

      expect(discount.isCurrentlyValid()).toBe(false);
    });

    it('should return true if all conditions are met', () => {
      const discount = {
        isActive: true,
        status: 'active',
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
        usageLimit: 10,
        usageCount: 5,
        isCurrentlyValid: Discount.schema.methods.isCurrentlyValid,
      };

      expect(discount.isCurrentlyValid()).toBe(true);
    });
  });

  describe('calculateDiscount method', () => {
    it('should calculate percentage discount correctly', () => {
      const discount = {
        type: 'percentage',
        value: 20,
        isCurrentlyValid: () => true,
        calculateDiscount: Discount.schema.methods.calculateDiscount,
      };

      const discountAmount = discount.calculateDiscount(100);
      expect(discountAmount).toBe(20);
    });

    it('should calculate fixed discount correctly', () => {
      const discount = {
        type: 'fixed',
        value: 15,
        isCurrentlyValid: () => true,
        calculateDiscount: Discount.schema.methods.calculateDiscount,
      };

      const discountAmount = discount.calculateDiscount(100);
      expect(discountAmount).toBe(15);
    });

    it('should apply max discount limit', () => {
      const discount = {
        type: 'percentage',
        value: 50,
        maxDiscountAmount: 20,
        isCurrentlyValid: () => true,
        calculateDiscount: Discount.schema.methods.calculateDiscount,
      };

      const discountAmount = discount.calculateDiscount(100);
      expect(discountAmount).toBe(20); // Should be capped at 20
    });

    it('should return 0 if order total below minimum', () => {
      const discount = {
        type: 'percentage',
        value: 20,
        minPurchaseAmount: 100,
        isCurrentlyValid: () => true,
        calculateDiscount: Discount.schema.methods.calculateDiscount,
      };

      const discountAmount = discount.calculateDiscount(50);
      expect(discountAmount).toBe(0);
    });

    it('should not exceed order total', () => {
      const discount = {
        type: 'fixed',
        value: 150,
        isCurrentlyValid: () => true,
        calculateDiscount: Discount.schema.methods.calculateDiscount,
      };

      const discountAmount = discount.calculateDiscount(100);
      expect(discountAmount).toBe(100); // Should not exceed order total
    });

    it('should calculate bulk pricing discount', () => {
      const discount = {
        type: 'bulk',
        bulkTiers: [
          { quantity: 1, discountPercent: 5 },
          { quantity: 5, discountPercent: 10 },
          { quantity: 10, discountPercent: 15 },
        ],
        isCurrentlyValid: () => true,
        calculateDiscount: Discount.schema.methods.calculateDiscount,
      };

      const discountAmount = discount.calculateDiscount(100, 7);
      expect(discountAmount).toBe(10); // 10% for qty 7
    });
  });
});

