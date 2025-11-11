import { GET, POST, PUT, DELETE } from '@/app/api/discounts/route';
import Discount from '@/models/Discount';
import connectDB from '@/lib/mongodb';

jest.mock('@/lib/mongodb');
jest.mock('@/models/Discount');

describe('Discounts API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/discounts', () => {
    it('should create a new discount', async () => {
      const mockDiscount = {
        _id: '123',
        code: 'TESTCODE',
        name: 'Test Discount',
        type: 'percentage',
        value: 20,
        status: 'active',
      };

      (connectDB as jest.Mock).mockResolvedValue(null);
      (Discount.findOne as jest.Mock).mockResolvedValue(null);
      (Discount.create as jest.Mock).mockResolvedValue(mockDiscount);

      const request = {
        json: async () => ({
          code: 'testcode',
          name: 'Test Discount',
          type: 'percentage',
          value: 20,
          status: 'active',
        }),
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.discount).toEqual(mockDiscount);
      expect(Discount.create).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'TESTCODE', // Should be uppercase
        })
      );
    });

    it('should return 400 if discount code already exists', async () => {
      (connectDB as jest.Mock).mockResolvedValue(null);
      (Discount.findOne as jest.Mock).mockResolvedValue({ code: 'TESTCODE' });

      const request = {
        json: async () => ({
          code: 'testcode',
          name: 'Test Discount',
          type: 'percentage',
          value: 20,
        }),
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Discount code already exists');
    });

    it('should handle errors gracefully', async () => {
      (connectDB as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = {
        json: async () => ({ code: 'TEST' }),
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create discount');
    });
  });

  describe('GET /api/discounts', () => {
    it('should validate a discount code', async () => {
      const mockDiscount = {
        _id: '123',
        code: 'TESTCODE',
        isCurrentlyValid: jest.fn().mockReturnValue(true),
      };

      (connectDB as jest.Mock).mockResolvedValue(null);
      (Discount.findOne as jest.Mock).mockResolvedValue(mockDiscount);

      const request = {
        url: 'http://localhost:3000/api/discounts?code=TESTCODE',
      } as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.isValid).toBe(true);
      expect(data.discount).toBeDefined();
    });

    it('should return 404 if discount not found', async () => {
      (connectDB as jest.Mock).mockResolvedValue(null);
      (Discount.findOne as jest.Mock).mockResolvedValue(null);

      const request = {
        url: 'http://localhost:3000/api/discounts?code=INVALID',
      } as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Discount code not found');
    });

    it('should list all discounts', async () => {
      const mockDiscounts = [
        { code: 'CODE1', value: 10 },
        { code: 'CODE2', value: 20 },
      ];

      (connectDB as jest.Mock).mockResolvedValue(null);
      (Discount.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockDiscounts),
      });

      const request = {
        url: 'http://localhost:3000/api/discounts',
      } as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.discounts).toHaveLength(2);
    });
  });

  describe('PUT /api/discounts', () => {
    it('should update a discount', async () => {
      const updatedDiscount = {
        _id: '123',
        code: 'TESTCODE',
        value: 30,
      };

      (connectDB as jest.Mock).mockResolvedValue(null);
      (Discount.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedDiscount);

      const request = {
        json: async () => ({
          id: '123',
          value: 30,
        }),
      } as NextRequest;

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.discount.value).toBe(30);
    });

    it('should return 400 if id is missing', async () => {
      const request = {
        json: async () => ({ value: 30 }),
      } as NextRequest;

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Discount ID required');
    });
  });

  describe('DELETE /api/discounts', () => {
    it('should delete a discount', async () => {
      (connectDB as jest.Mock).mockResolvedValue(null);
      (Discount.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: '123' });

      const request = {
        url: 'http://localhost:3000/api/discounts?id=123',
      } as NextRequest;

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Discount deleted successfully');
    });

    it('should return 404 if discount not found', async () => {
      (connectDB as jest.Mock).mockResolvedValue(null);
      (Discount.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const request = {
        url: 'http://localhost:3000/api/discounts?id=999',
      } as NextRequest;

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Discount not found');
    });
  });
});

