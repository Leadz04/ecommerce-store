'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

interface CountdownProps {
  endDate: Date;
  onComplete?: () => void;
  className?: string;
  showLabels?: boolean;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function Countdown({ endDate, onComplete, className, showLabels = true, compact = false }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  
  function calculateTimeLeft(): TimeLeft {
    const difference = new Date(endDate).getTime() - Date.now();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  }
  
  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (Object.values(newTimeLeft).every(v => v === 0)) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [endDate, onComplete]);
  
  const isExpired = Object.values(timeLeft).every(v => v === 0);
  
  if (isExpired) {
    return (
      <div className={cn('text-red-600 font-semibold', className)}>
        Sale Ended
      </div>
    );
  }
  
  if (compact) {
    return (
      <div className={cn('flex items-center gap-1 font-mono font-semibold', className)}>
        {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
        <span>{String(timeLeft.hours).padStart(2, '0')}:</span>
        <span>{String(timeLeft.minutes).padStart(2, '0')}:</span>
        <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
    );
  }
  
  return (
    <div className={cn('flex gap-2', className)}>
      {timeLeft.days > 0 && (
        <TimeUnit value={timeLeft.days} label="Days" />
      )}
      <TimeUnit value={timeLeft.hours} label="Hours" />
      <TimeUnit value={timeLeft.minutes} label="Mins" />
      <TimeUnit value={timeLeft.seconds} label="Secs" />
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg px-3 py-2 min-w-[60px] text-center">
        <div className="text-2xl font-bold font-mono">
          {String(value).padStart(2, '0')}
        </div>
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium">
        {label}
      </div>
    </div>
  );
}

