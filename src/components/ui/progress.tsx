'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  showLabel?: boolean;
  animate?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, showLabel = false, animate = true, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    return (
      <div
        ref={ref}
        className={cn('relative h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800', className)}
        {...props}
      >
        {animate ? (
          <motion.div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {showLabel && (
              <div className="flex items-center justify-center h-full text-xs text-white font-medium">
                {Math.round(percentage)}%
              </div>
            )}
          </motion.div>
        ) : (
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all"
            style={{ width: `${percentage}%` }}
          >
            {showLabel && (
              <div className="flex items-center justify-center h-full text-xs text-white font-medium">
                {Math.round(percentage)}%
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };

