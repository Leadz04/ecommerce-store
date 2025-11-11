import { GET, POST } from '@/app/api/loyalty/route';
import LoyaltyAccount, { POINTS_CONFIG } from '@/models/LoyaltyProgram';
import connectDB from '@/lib/mongodb';

jest.mock('@/lib/mongodb');
jest.mock('@/models/LoyaltyProgram');

describe('Loyalty Program API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/loyalty', () => {
    it('should return existing loyalty account', async () => {
      const mockAccount = {
        userId: 'user123',
        points: 500,
        tier: 'silver',
        lifetimePoints: 1500,
      };

      (connectDB as jest.Mock).mockResolvedValue(null);
      (LoyaltyAccount.findOne as jest.Mock).mockResolvedValue(mockAccount);

      const request = {
        url: 'http://localhost:3000/api/loyalty?userId=user123',
      } as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.loyaltyAccount.points).toBe(500);
      expect(data.loyaltyAccount.tier).toBe('silver');
    });

    it('should create new loyalty account with signup bonus', async () => {
      const mockAccount = {
        userId: 'newuser',
        points: 100,
        tier: 'bronze',
        lifetimePoints: 100,
        referralCode: 'NEWUSE123',
        updateTier: jest.fn(),
        save: jest.fn(),
      };

      (connectDB as jest.Mock).mockResolvedValue(null);
      (LoyaltyAccount.findOne as jest.Mock).mockResolvedValue(null);
      (LoyaltyAccount.generateReferralCode as jest.Mock).mockResolvedValue('NEWUSE123');
      (LoyaltyAccount.create as jest.Mock).mockResolvedValue(mockAccount);

      const request = {
        url: 'http://localhost:3000/api/loyalty?userId=newuser',
      } as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.loyaltyAccount.points).toBe(100); // Signup bonus
      expect(LoyaltyAccount.create).toHaveBeenCalledWith(
        expect.objectContaining({
          points: POINTS_CONFIG.signupBonus,
        })
      );
    });

    it('should return 400 if userId is missing', async () => {
      const request = {
        url: 'http://localhost:3000/api/loyalty',
      } as NextRequest;

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('User ID required');
    });
  });

  describe('POST /api/loyalty - Add Purchase Points', () => {
    it('should add points for purchase', async () => {
      const mockAccount = {
        userId: 'user123',
        points: 500,
        lifetimeSpent: 0,
        addPoints: jest.fn(),
        save: jest.fn(),
      };

      (connectDB as jest.Mock).mockResolvedValue(null);
      (LoyaltyAccount.findOne as jest.Mock).mockResolvedValue(mockAccount);
      (LoyaltyAccount.calculatePurchasePoints as jest.Mock).mockReturnValue(100);

      const request = {
        json: async () => ({
          userId: 'user123',
          action: 'purchase',
          data: { amount: 100, orderId: 'order123' },
        }),
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockAccount.addPoints).toHaveBeenCalledWith(
        100,
        'Purchase order order123',
        'earned',
        'order123'
      );
      expect(mockAccount.lifetimeSpent).toBe(100);
    });
  });

  describe('POST /api/loyalty - Redeem Points', () => {
    it('should redeem points successfully', async () => {
      const mockAccount = {
        userId: 'user123',
        points: 500,
        redeemPoints: jest.fn().mockReturnValue(true),
        save: jest.fn(),
      };

      (connectDB as jest.Mock).mockResolvedValue(null);
      (LoyaltyAccount.findOne as jest.Mock).mockResolvedValue(mockAccount);

      const request = {
        json: async () => ({
          userId: 'user123',
          action: 'redeem',
          data: { points: 100, reason: 'Discount' },
        }),
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockAccount.redeemPoints).toHaveBeenCalledWith(100, 'Discount', undefined);
    });

    it('should return 400 if insufficient points', async () => {
      const mockAccount = {
        userId: 'user123',
        points: 50,
        redeemPoints: jest.fn().mockReturnValue(false),
      };

      (connectDB as jest.Mock).mockResolvedValue(null);
      (LoyaltyAccount.findOne as jest.Mock).mockResolvedValue(mockAccount);

      const request = {
        json: async () => ({
          userId: 'user123',
          action: 'redeem',
          data: { points: 100 },
        }),
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Insufficient points');
    });
  });

  describe('POST /api/loyalty - Referral Bonus', () => {
    it('should add referral bonus points', async () => {
      const mockAccount = {
        userId: 'user123',
        referrals: [],
        addPoints: jest.fn(),
        save: jest.fn(),
      };

      (connectDB as jest.Mock).mockResolvedValue(null);
      (LoyaltyAccount.findOne as jest.Mock).mockResolvedValue(mockAccount);

      const request = {
        json: async () => ({
          userId: 'user123',
          action: 'referral',
          data: {
            referredUserId: 'user456',
            referredEmail: 'friend@example.com',
          },
        }),
      } as NextRequest;

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockAccount.addPoints).toHaveBeenCalledWith(
        POINTS_CONFIG.referralBonus,
        'Referred friend@example.com',
        'bonus'
      );
    });
  });
});

