import React from 'react';
import { KupsTier } from '../types';

interface TierBadgeProps {
  tier: KupsTier | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = 'md', showLabel = true }) => {
  const norm = (tier || '').toUpperCase();

  let bg = 'bg-earth-sand-surface';
  let text = 'text-earth-soil';
  let border = 'border-earth-sand-border';
  let label = tier || '-';

  if (norm === 'BIRU' || norm === 'BLUE') {
    bg = 'bg-blue-50';
    text = 'text-blue-800';
    border = 'border-blue-400';
    label = 'Biru (Blue)';
  } else if (norm === 'PERAK' || norm === 'SILVER') {
    bg = 'bg-stone-100';
    text = 'text-stone-800';
    border = 'border-stone-400';
    label = 'Perak (Silver)';
  } else if (norm === 'EMAS' || norm === 'GOLD') {
    bg = 'bg-amber-100';
    text = 'text-amber-900';
    border = 'border-amber-500';
    label = 'Emas (Gold)';
  } else if (norm === 'PLATINUM') {
    bg = 'bg-emerald-100';
    text = 'text-emerald-950 font-bold';
    border = 'border-emerald-600';
    label = 'Platinum';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 border',
    md: 'text-xs px-2.5 py-1 border font-semibold tracking-wide',
    lg: 'text-sm px-3.5 py-1.5 border font-bold tracking-wider',
  };

  return (
    <span
      className={`inline-flex items-center uppercase tracking-wider ${bg} ${text} ${border} ${sizeClasses[size]}`}
    >
      {showLabel ? label : norm}
    </span>
  );
};
