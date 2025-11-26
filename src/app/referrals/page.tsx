'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Gift, Share2, Copy, Check, Users, TrendingUp, Award, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface ReferralStats {
  referralCode: string | null;
  referralLink?: string;
  shareText?: string;
  stats: {
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    rewardedReferrals: number;
    totalRewardValue: number;
  };
  recentReferrals: Array<{
    refereeName: string;
    refereeEmail: string;
    status: string;
    rewardGranted: boolean;
    rewardValue: number;
    createdAt: string;
    firstOrderAmount?: number;
  }>;
}

export default function ReferralsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [referralData, setReferralData] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchReferralData();
  }, [isAuthenticated, router]);

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Get referral code first
      const codeResponse = await fetch('/api/referrals/code', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!codeResponse.ok) {
        throw new Error('Failed to fetch referral code');
      }

      const codeData = await codeResponse.json();

      // Get referral stats
      const statsResponse = await fetch('/api/referrals/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch referral stats');
      }

      const statsData = await statsResponse.json();

      setReferralData({
        referralCode: codeData.referralCode,
        referralLink: codeData.referralLink,
        shareText: codeData.shareText,
        ...statsData
      });
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast.error('Failed to load referral information');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    if (!referralData?.referralLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me and get $20 off!',
          text: referralData.shareText || `Use my referral code ${referralData.referralCode} and we both get $20 off!`,
          url: referralData.referralLink
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled');
      }
    } else {
      copyToClipboard(referralData.referralLink);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!referralData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load referral information</p>
          <button
            onClick={fetchReferralData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-4">
            <Link
              href="/profile"
              className="flex items-center text-blue-100 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Profile
            </Link>
          </div>
          <div className="flex items-center mb-4">
            <Gift className="h-10 w-10 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold">Referral Program</h1>
          </div>
          <p className="text-xl text-blue-100 mt-2">
            Refer friends and both of you get $20 off your next purchase!
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Referral Code Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Referral Code</h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Your Unique Code</p>
                  <p className="text-4xl font-bold text-gray-900">{referralData.referralCode || 'Loading...'}</p>
                </div>
                <Gift className="h-16 w-16 text-blue-500" />
              </div>
            </div>

            {/* Referral Link */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Referral Link
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={referralData.referralLink || ''}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                />
                <button
                  onClick={() => copyToClipboard(referralData.referralLink || '')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-5 w-5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Share Button */}
            <button
              onClick={shareReferral}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
            >
              <Share2 className="h-5 w-5" />
              <span>Share Referral Link</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="h-8 w-8 text-blue-500" />
                <span className="text-3xl font-bold text-gray-900">{referralData.stats.totalReferrals}</span>
              </div>
              <p className="text-gray-600">Total Referrals</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <span className="text-3xl font-bold text-gray-900">{referralData.stats.completedReferrals}</span>
              </div>
              <p className="text-gray-600">Completed</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Award className="h-8 w-8 text-yellow-500" />
                <span className="text-3xl font-bold text-gray-900">{referralData.stats.rewardedReferrals}</span>
              </div>
              <p className="text-gray-600">Rewards Earned</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Gift className="h-8 w-8 text-purple-500" />
                <span className="text-3xl font-bold text-gray-900">${referralData.stats.totalRewardValue}</span>
              </div>
              <p className="text-gray-600">Total Rewards</p>
            </div>
          </div>

          {/* Recent Referrals */}
          {referralData.recentReferrals.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Referrals</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Friend
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reward
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {referralData.recentReferrals.map((referral, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{referral.refereeName}</div>
                            <div className="text-sm text-gray-500">{referral.refereeEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            referral.status === 'rewarded' ? 'bg-green-100 text-green-800' :
                            referral.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {referral.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {referral.rewardGranted ? (
                            <span className="text-green-600 font-semibold">${referral.rewardValue} earned</span>
                          ) : (
                            <span className="text-gray-400">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* How It Works */}
          <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Share Your Code</h3>
                  <p className="text-gray-600">Share your unique referral code or link with friends and family.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">They Sign Up</h3>
                  <p className="text-gray-600">Your friend signs up using your referral code and makes their first purchase.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">You Both Get Rewards</h3>
                  <p className="text-gray-600">Both you and your friend receive $20 off your next purchase!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

