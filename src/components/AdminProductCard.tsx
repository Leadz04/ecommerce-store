'use client';

import { ReactNode } from 'react';
import clsx from 'clsx';
import {
  DollarSign,
  Package,
  Star,
  Tag,
  ShieldCheck,
  Sparkles,
  Activity,
  Eye,
} from 'lucide-react';

type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
type StatTone = 'default' | 'info' | 'success' | 'warning' | 'danger';

export interface AdminProductCardProduct {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  category?: string;
  brand?: string;
  price?: number;
  originalPrice?: number;
  stockCount?: number;
  status?: string;
  isActive?: boolean;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  etsyExported?: boolean;
}

export interface AdminProductCardBadge {
  label: string;
  tone?: BadgeTone;
  icon?: ReactNode;
  subtle?: boolean;
}

export interface AdminProductCardStat {
  label: string;
  value: string | number;
  icon?: ReactNode;
  helper?: string;
  tone?: StatTone;
}

export interface AdminProductCardProps {
  product: AdminProductCardProduct;
  className?: string;
  metaBadges?: AdminProductCardBadge[];
  statHighlights?: AdminProductCardStat[];
  topRightSlot?: ReactNode;
  actionButtons?: ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    icon?: ReactNode;
    disabled?: boolean;
  };
  secondaryActions?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  highlightTone?: 'emerald' | 'blue' | 'violet' | 'orange';
  density?: 'default' | 'compact';
  showTags?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}

const badgeToneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-gray-100 text-gray-700 border border-gray-200',
  info: 'bg-blue-50 text-blue-700 border border-blue-200',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  danger: 'bg-red-50 text-red-700 border border-red-200',
};

const statToneClasses: Record<StatTone, string> = {
  default: 'text-gray-900',
  info: 'text-blue-700',
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger: 'text-red-700',
};

const toneGradient: Record<NonNullable<AdminProductCardProps['highlightTone']>, string> = {
  emerald: 'from-emerald-50 to-teal-50 border-emerald-100',
  blue: 'from-sky-50 to-indigo-50 border-sky-100',
  violet: 'from-violet-50 to-fuchsia-50 border-violet-100',
  orange: 'from-amber-50 to-orange-50 border-amber-100',
};

const formatCurrency = (value?: number) => {
  if (value === null || value === undefined) return '—';
  return `$${value.toFixed(2)}`;
};

const defaultImage = '/vercel.svg';

const AdminProductCard = ({
  product,
  className,
  metaBadges,
  statHighlights,
  topRightSlot,
  actionButtons,
  primaryAction,
  secondaryActions,
  children,
  footer,
  highlightTone = 'emerald',
  density = 'default',
  showTags = true,
  onClick,
  clickable = false,
}: AdminProductCardProps) => {
  const {
    name,
    description,
    image,
    category,
    brand,
    price,
    originalPrice,
    stockCount,
    status,
    isActive,
    rating,
    reviewCount,
    tags,
    etsyExported,
  } = product;

  const baseBadges: AdminProductCardBadge[] = [];
  if (category) baseBadges.push({ label: category, tone: 'info', icon: <Tag className="h-3.5 w-3.5" /> });
  if (brand) baseBadges.push({ label: brand, tone: 'neutral' });
  if (isActive !== undefined) {
    baseBadges.push({
      label: isActive ? 'Active' : 'Inactive',
      tone: isActive ? 'success' : 'danger',
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
    });
  }
  if (status) {
    baseBadges.push({
      label: status.charAt(0).toUpperCase() + status.slice(1),
      tone: status === 'published' ? 'success' : status === 'draft' ? 'neutral' : 'warning',
    });
  }
  if (etsyExported) {
    baseBadges.push({
      label: 'Etsy Exported',
      tone: 'info',
      icon: <Sparkles className="h-3.5 w-3.5" />,
    });
  }

  const mergedBadges = [...baseBadges, ...(metaBadges || [])];

  const priceStat: AdminProductCardStat = {
    label: 'Price',
    value: formatCurrency(price),
    icon: <DollarSign className="h-3.5 w-3.5 text-green-500" />,
  };

  const stockStat: AdminProductCardStat | null =
    typeof stockCount === 'number'
      ? {
          label: 'Stock',
          value: stockCount,
          icon: <Package className="h-3.5 w-3.5 text-indigo-500" />,
        }
      : null;

  const ratingStat: AdminProductCardStat | null =
    typeof rating === 'number'
      ? {
          label: 'Rating',
          value: `${rating.toFixed(1)} · ${reviewCount || 0}`,
          icon: <Star className="h-3.5 w-3.5 text-yellow-500" />,
        }
      : null;

  const tagsStat: AdminProductCardStat | null =
    tags && tags.length
      ? {
          label: 'Tags',
          value: `${tags.length} tags`,
          icon: <Tag className="h-3.5 w-3.5 text-purple-500" />,
        }
      : null;

  const mergedStats = [
    priceStat,
    stockStat,
    ratingStat,
    tagsStat,
    ...(statHighlights || []),
  ].filter(Boolean) as AdminProductCardStat[];

  const gradientClass = toneGradient[highlightTone] || toneGradient.emerald;
  const isCompact = density === 'compact';
  const headerPadding = isCompact ? 'p-4' : 'p-5 sm:p-6';
  const bodyPadding = isCompact ? 'p-4 space-y-3' : 'p-5 sm:p-6 space-y-4';
  const footerPadding = isCompact ? 'px-4 pb-4' : 'px-5 sm:px-6 pb-5 sm:pb-6';
  const imageSize = isCompact ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-20 h-20 sm:w-24 sm:h-24';
  const badgeTextSize = isCompact ? 'text-[10px]' : 'text-[11px]';
  const statsGridCols = isCompact ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 sm:grid-cols-2 xl:grid-cols-4';

  const isClickable = clickable || !!onClick;

  // Minimal card design - only essential info
  return (
    <div
      onClick={onClick}
      className={clsx(
        'group rounded-2xl border-2 bg-white shadow-sm flex flex-col overflow-hidden',
        'transition-all duration-300',
        isClickable && [
          'cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:border-blue-400',
          'active:scale-[0.98] active:shadow-lg',
        ],
        !isClickable && 'hover:shadow-md',
        className
      )}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <img
          src={image || defaultImage}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        {/* Status Badge Overlay */}
        {isActive !== undefined && (
          <div className="absolute top-3 right-3">
            <span className={clsx(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase shadow-md',
              isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
            )}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        )}
        {/* Click Indicator */}
        {isClickable && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        )}
      </div>

      {/* Minimal Info */}
      <div className="p-4 space-y-2">
        {/* Brand/Category Badge */}
        {(brand || category) && (
          <div className="flex flex-wrap gap-1.5">
            {category && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
                {category}
              </span>
            )}
            {brand && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold text-gray-600 bg-gray-50 border border-gray-200">
                {brand}
              </span>
            )}
          </div>
        )}

        {/* Product Name */}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">
          {name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-green-600">
            {formatCurrency(price)}
          </span>
          {originalPrice && originalPrice > (price || 0) && (
            <span className="text-sm text-gray-400 line-through">
              {formatCurrency(originalPrice)}
            </span>
          )}
        </div>

        {/* Quick Stats (only if provided via metaBadges or statHighlights) */}
        {statHighlights && statHighlights.length > 0 && (
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            {statHighlights.slice(0, 2).map((stat, idx) => (
              <div key={idx} className="flex items-center gap-1 text-xs text-gray-600">
                {stat.icon}
                <span className="font-medium">{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons (if provided) */}
      {(actionButtons || primaryAction || secondaryActions) && (
        <div className="px-4 pb-4 pt-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">{actionButtons}</div>
            <div className="flex flex-wrap gap-2">
              {secondaryActions}
              {primaryAction && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    primaryAction.onClick();
                  }}
                  disabled={primaryAction.disabled || primaryAction.loading}
                  className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {primaryAction.loading ? (
                    <>
                      <Activity className="h-3 w-3 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {primaryAction.icon}
                      {primaryAction.label}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          {footer && <div className="mt-3 border-t border-gray-100 pt-3">{footer}</div>}
        </div>
      )}
    </div>
  );
};

export default AdminProductCard;

