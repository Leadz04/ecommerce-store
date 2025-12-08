/**
 * Etsy Trademark Disclaimer Component
 * 
 * Required by Etsy API Terms of Use Section 1:
 * "You must prominently display the following statement within your Application:
 * 'The term 'Etsy' is a trademark of Etsy, Inc. This Application uses Etsy's API, 
 * but is not endorsed or certified by Etsy.'"
 */

import { Info } from 'lucide-react';
import { ETSY_TRADEMARK_DISCLAIMER } from '@/lib/etsy-compliance';

interface EtsyTrademarkDisclaimerProps {
  variant?: 'full' | 'compact' | 'inline';
  className?: string;
}

export default function EtsyTrademarkDisclaimer({ 
  variant = 'full',
  className = ''
}: EtsyTrademarkDisclaimerProps) {
  if (variant === 'inline') {
    return (
      <span className={`text-xs text-gray-500 ${className}`}>
        {ETSY_TRADEMARK_DISCLAIMER}
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-900">
          {ETSY_TRADEMARK_DISCLAIMER}
        </p>
      </div>
    );
  }

  // Full variant (default)
  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <Info className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-blue-900 mb-1">
            Etsy API Integration Notice
          </h4>
          <p className="text-sm text-blue-800 leading-relaxed">
            {ETSY_TRADEMARK_DISCLAIMER}
          </p>
        </div>
      </div>
    </div>
  );
}
