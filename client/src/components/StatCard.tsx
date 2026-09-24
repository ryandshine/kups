import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: 'forest' | 'terracotta' | 'clay' | 'sand';
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accentColor = 'forest',
  badge,
}) => {
  const accentBorder = {
    forest: 'border-l-4 border-l-earth-forest',
    terracotta: 'border-l-4 border-l-earth-terracotta',
    clay: 'border-l-4 border-l-earth-clay',
    sand: 'border-l-4 border-l-earth-sand-dark',
  };

  return (
    <div
      className={`bg-white border border-earth-sand-border p-5 flex flex-col justify-between ${accentBorder[accentColor]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs uppercase font-semibold text-earth-soil-muted tracking-wider block">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-earth-soil mt-1 font-mono tracking-tight">
            {value}
          </div>
        </div>
        {icon && (
          <div className="p-2.5 bg-earth-sand-surface border border-earth-sand-border text-earth-soil">
            {icon}
          </div>
        )}
      </div>
      {(subtitle || badge) && (
        <div className="mt-3 pt-3 border-t border-earth-sand flex items-center justify-between text-xs text-earth-soil-muted">
          <span>{subtitle}</span>
          {badge && (
            <span className="bg-earth-sand-surface px-2 py-0.5 font-medium border border-earth-sand-border text-earth-soil">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
