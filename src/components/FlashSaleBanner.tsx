'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Countdown } from './ui/countdown';
import { Badge } from './ui/badge';
import { X, Flame } from 'lucide-react';

interface FlashSale {
  _id: string;
  name: string;
  description?: string;
  endDate: Date;
  badgeText: string;
  products: Array<{
    productId: string;
    discountPercentage: number;
  }>;
}

export function FlashSaleBanner() {
  const [flashSale, setFlashSale] = useState<FlashSale | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchActiveFlashSale();
    
    // Check for dismissed flash sale
    const dismissed = sessionStorage.getItem('flashSaleDismissed');
    if (dismissed) {
      setIsVisible(false);
    }
  }, []);
  
  const fetchActiveFlashSale = async () => {
    try {
      const response = await fetch('/api/flash-sales/active');
      if (response.ok) {
        const data = await response.json();
        if (data.flashSale) {
          setFlashSale(data.flashSale);
        }
      }
    } catch (error) {
      console.error('Failed to fetch flash sale:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('flashSaleDismissed', 'true');
  };
  
  const handleComplete = () => {
    setFlashSale(null);
    sessionStorage.removeItem('flashSaleDismissed');
  };
  
  if (isLoading || !flashSale || !isVisible) {
    return null;
  }
  
  const maxDiscount = Math.max(...flashSale.products.map(p => p.discountPercentage));
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Flash Sale Info */}
            <div className="flex items-center gap-3 flex-1">
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
              >
                <Flame className="w-6 h-6" />
              </motion.div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="warning" className="bg-yellow-400 text-gray-900">
                    {flashSale.badgeText}
                  </Badge>
                  <span className="font-bold text-lg">
                    Up to {maxDiscount}% OFF
                  </span>
                </div>
                <p className="text-sm text-white/90">
                  {flashSale.description || flashSale.name}
                </p>
              </div>
            </div>
            
            {/* Countdown */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-xs text-white/80 mb-1">Ends in</div>
                <Countdown
                  endDate={new Date(flashSale.endDate)}
                  onComplete={handleComplete}
                  compact
                  className="text-white"
                />
              </div>
              
              <Link
                href={`/flash-sale/${flashSale._id}`}
                className="bg-white text-red-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors"
              >
                Shop Now
              </Link>
            </div>
            
            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Dismiss flash sale banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Animated Background Pattern */}
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%']
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}

