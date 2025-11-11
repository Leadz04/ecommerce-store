import { GET, POST } from '@/app/api/gift-cards/route';
import GiftCard from '@/models/GiftCard';
import connectDB from '@/lib/mongodb';

jest.mock('@/lib/mongodb');
jest.mock('@/models/GiftCard');

describe('Gift Cards API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/gift-cards', () => {
    it('should create a new gift card with unique code', async () => {
      const mockGiftCard = {
        _id: '123',
        code: 'ABCD-EFGH-IJKL-MNOP',
        initialBalance: 100,
        currentBalance: 100,
        currency: 'USD',
        status: 'active',
      };

      (connectDB as jest.Mock).mockResolvedValue(null);
      (GiftCard.generateUniqueCode as jest.Mock).mockResolvedValue('ABCD-EFGH-IJKL-MNOP');
      (GiftCard.create as jest.Mock).mockResolvedValue(mockGiftCard);

      const request = {
        json: async () => ({
          amount: 100,
          recipientEmail: 'test@example.com',
          message: 'Happy Birthday!',
        }),
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.giftCard.code).toBe('ABCD-EFGH-IJKL-MNOP');
      expect(data.giftCard.initialBalance).toBe(100);
      expect(GiftCard.generateUniqueCode).toHaveBeenCalled();
    });

    it('should set expiry date to 1 year if not provided', async () => {
      const mockGiftCard = { code: 'TEST-CODE', expiryDate: expect.any(Date) };

      (connectDB as jest.Mock).mockResolvedValue(null);
      (GiftCard.generateUniqueCode as jest.Mock).mockResolvedValue('TEST-CODE');
      (GiftCard.create as jest.Mock).mockResolvedValue(mockGiftCard);

      const request = {
        json: async () => ({ amount: 50 }),
      } as NextRequest;

      const response = await POST(request);

      expect(GiftCard.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expiryDate: expect.any(Date),
        })
      );
    });
  });

  describe('GET /api/gift-cards', () => {
    it('should check gift card balance', async () => {
      const mockGiftCard = {
        code: 'TEST-CODE',
        currentBalance: 75,
        currency: 'USD',
        status: 'active',
        isValid: jest.fn().mockReturnValue(true),
      };

      (connectDB as jest.Mock).mockResolvedValue(null);
      (GiftCard.findOne as jest.Mock).mockResolvedValue(mockGiftCard);

      const request = {
        url: 'http://localhost:3000/api/gift-cards?code=TEST-CODE',
      } as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.giftCard.currentBalance).toBe(75);
      expect(data.giftCard.isValid).toBe(true);
    });

    it('should return 404 if gift card not found', async () => {
      (connectDB as jest.Mock).mockResolvedValue(null);
      (GiftCard.findOne as jest.Mock).mockResolvedValue(null);

      const request = {
        url: 'http://localhost:3000/api/gift-cards?code=INVALID',
      } as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Gift card not found');
    });

    it('should list user gift cards', async () => {
      const mockGiftCards = [
        { code: 'CODE1', currentBalance: 50 },
        { code: 'CODE2', currentBalance: 100 },
      ];

      (connectDB as jest.Mock).mockResolvedValue(null);
      (GiftCard.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockGiftCards),
      });

      const request = {
        url: 'http://localhost:3000/api/gift-cards?userId=user123',
      } as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.giftCards).toHaveLength(2);
    });
  });
});

