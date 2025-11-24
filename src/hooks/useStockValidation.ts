'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

interface StockValidationResult {
    isValid: boolean;
    outOfStockItems: Array<{
        productId: string;
        name: string;
        requestedQty: number;
        availableStock: number;
    }>;
}

export function useStockValidation() {
    const { items } = useCartStore();
    const [isValidating, setIsValidating] = useState(false);
    const [stockStatus, setStockStatus] = useState<StockValidationResult>({
        isValid: true,
        outOfStockItems: []
    });

    const validateStock = async (): Promise<boolean> => {
        setIsValidating(true);
        try {
            const outOfStockItems = [];

            for (const item of items) {
                const productId = item.product._id || item.product.id;

                // Fetch current stock from API
                const response = await fetch(`/api/products/${productId}`);
                if (!response.ok) continue;

                const data = await response.json();
                const product = data.product;

                if (!product.inStock || product.stockCount < item.quantity) {
                    outOfStockItems.push({
                        productId: productId as string,
                        name: item.product.name,
                        requestedQty: item.quantity,
                        availableStock: product.stockCount || 0
                    });
                }
            }

            const result = {
                isValid: outOfStockItems.length === 0,
                outOfStockItems
            };

            setStockStatus(result);

            if (!result.isValid) {
                // Show error toast for each out-of-stock item
                outOfStockItems.forEach(item => {
                    toast.error(
                        `${item.name}: Only ${item.availableStock} in stock (you have ${item.requestedQty} in cart)`,
                        { duration: 5000 }
                    );
                });
            }

            return result.isValid;
        } catch (error) {
            console.error('[Stock Validation] Error:', error);
            toast.error('Unable to verify stock availability. Please try again.');
            return false;
        } finally {
            setIsValidating(false);
        }
    };

    return {
        validateStock,
        isValidating,
        stockStatus
    };
}
