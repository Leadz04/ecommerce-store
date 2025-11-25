'use client';

import { useState } from 'react';
import { Tag, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PromoCodeInputProps {
    onApply: (promo: { token: string; discountPercent: number; productId?: string }) => void;
    onRemove: () => void;
    currentPromo: { token: string; discountPercent: number } | null;
    discountAmount: number;
}

export default function PromoCodeInput({ onApply, onRemove, currentPromo, discountAmount }: PromoCodeInputProps) {
    const [promoCode, setPromoCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    const handleApply = async () => {
        if (!promoCode.trim()) {
            toast.error('Please enter a promo code');
            return;
        }

        setIsValidating(true);
        try {
            // Validate promo code with API
            const response = await fetch(`/api/promotions/validate?token=${encodeURIComponent(promoCode.trim())}`);

            if (!response.ok) {
                const error = await response.json();
                toast.error(error.error || 'Invalid promo code');
                setIsValidating(false);
                return;
            }

            const data = await response.json();

            if (data.success && data.promo) {
                onApply({
                    token: data.promo.token,
                    discountPercent: data.promo.discountPercent,
                    productId: data.promo.productId
                });
                toast.success(`Promo code applied! ${data.promo.discountPercent}% off`);
                setPromoCode('');
            } else {
                toast.error('Invalid promo code');
            }
        } catch (error) {
            console.error('Error validating promo:', error);
            toast.error('Failed to validate promo code');
        } finally {
            setIsValidating(false);
        }
    };

    const handleRemove = () => {
        onRemove();
        setPromoCode('');
        toast.success('Promo code removed');
    };

    if (currentPromo) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                            <Tag className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-green-900">Promo Applied!</p>
                            <p className="text-sm text-green-700">
                                {currentPromo.discountPercent}% off • Saving ${discountAmount.toFixed(2)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleRemove}
                        className="p-2 hover:bg-green-100 rounded-full transition-colors self-start sm:self-auto"
                        aria-label="Remove promo code"
                    >
                        <X className="h-5 w-5 text-green-600" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">
                Have a promo code?
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                    placeholder="Enter code"
                    className="flex-1 min-w-0 px-4 py-3 border-2 border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    disabled={isValidating}
                />
                <button
                    onClick={handleApply}
                    disabled={isValidating || !promoCode.trim()}
                    className="w-full sm:w-auto sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                    {isValidating ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Validating...</span>
                        </>
                    ) : (
                        'Apply'
                    )}
                </button>
            </div>
        </div>
    );
}
