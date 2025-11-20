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

  return (
    <div
      className={clsx(
        'rounded-3xl border bg-white shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden',
        className
      )}
    >
      <div className={clsx(headerPadding, 'bg-gradient-to-r', gradientClass)}>
        <div className="flex gap-4">
          <div className={clsx(imageSize, 'flex-shrink-0 rounded-2xl overflow-hidden border border-white/60 shadow-inner bg-white')}>
            <img
              src={image || defaultImage}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex flex-wrap gap-2 items-center">
              {mergedBadges.map((badge, idx) => (
                <span
                  key={`${badge.label}-${idx}`}
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold tracking-wide uppercase',
                    badgeTextSize,
                    badgeToneClasses[badge.tone || 'neutral'],
                    badge.subtle && 'bg-white/70'
                  )}
                >
                  {badge.icon}
                  {badge.label}
                </span>
              ))}
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  {name}
                </h3>
                {description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
                )}
              </div>
              {topRightSlot && <div className="flex-shrink-0">{topRightSlot}</div>}
            </div>
          </div>
        </div>
      </div>

      <div className={clsx(bodyPadding, 'flex-1')}>
        {mergedStats.length > 0 && (
          <div className={clsx('grid gap-3', statsGridCols)}>
            {mergedStats.map((stat, idx) => (
              <div key={`${stat.label}-${idx}`} className="rounded-2xl border border-gray-100 bg-gray-50/60 px-3 py-2.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{stat.label}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {stat.icon}
                  <span className={clsx('text-sm font-semibold', statToneClasses[stat.tone || 'default'])}>
                    {stat.value}
                  </span>
                </div>
                {stat.helper && <p className="text-[11px] text-gray-500 mt-0.5">{stat.helper}</p>}
              </div>
            ))}
          </div>
        )}

        {showTags && tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 6).map((tagValue) => (
              <span
                key={tagValue}
                className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium"
              >
                {tagValue}
              </span>
            ))}
            {tags.length > 6 && (
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                +{tags.length - 6} more
              </span>
            )}
          </div>
        )}

        {children}
      </div>

      <div className={footerPadding}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">{actionButtons}</div>
          <div className="flex flex-wrap gap-2">
            {secondaryActions}
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled || primaryAction.loading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                {primaryAction.loading ? (
                  <>
                    <Activity className="h-4 w-4 animate-spin" />
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
        {footer && <div className="mt-4 border-t border-gray-100 pt-4">{footer}</div>}
      </div>
    </div>
  );
};

export default AdminProductCard;

