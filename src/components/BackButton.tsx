'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
  variant?: 'default' | 'icon-only' | 'with-label';
  onClick?: () => void;
}

export default function BackButton({ 
  href, 
  label = 'Back', 
  className = '',
  variant = 'default',
  onClick
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  const baseClasses = "inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 text-sm sm:text-base font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors";
  const iconOnlyClasses = "p-2 sm:p-2.5 text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors";
  const withLabelClasses = "inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 text-sm sm:text-base font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors";

  const getClasses = () => {
    if (variant === 'icon-only') return iconOnlyClasses;
    if (variant === 'with-label') return withLabelClasses;
    return baseClasses;
  };

  if (href && !onClick) {
    return (
      <Link 
        href={href}
        className={`${getClasses()} ${className}`}
        aria-label={label}
      >
        <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        {variant !== 'icon-only' && <span className="hidden sm:inline">{label}</span>}
      </Link>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`${getClasses()} ${className}`}
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      {variant !== 'icon-only' && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}

