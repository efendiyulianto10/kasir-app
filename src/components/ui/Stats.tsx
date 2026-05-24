import React from 'react';
import { cn } from '../../utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  change,
  icon,
  trend,
  variant = 'default',
}) => {
  const variants = {
    default: 'bg-white',
    primary: 'bg-gradient-to-br from-orange-500 to-orange-600 text-white',
    success: 'bg-gradient-to-br from-green-500 to-green-600 text-white',
    warning: 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white',
    danger: 'bg-gradient-to-br from-red-500 to-red-600 text-white',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400';

  return (
    <div className={cn(
      'p-6 rounded-2xl shadow-sm border border-gray-100',
      variants[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn(
            'text-sm font-medium',
            variant === 'default' ? 'text-gray-500' : 'text-white/80'
          )}>
            {title}
          </p>
          <p className={cn(
            'text-3xl font-bold mt-2',
            variant === 'default' ? 'text-gray-900' : 'text-white'
          )}>
            {value}
          </p>
          {(subtitle || change !== undefined) && (
            <div className="flex items-center gap-2 mt-2">
              {change !== undefined && (
                <span className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  variant === 'default' ? trendColor : 'text-white/80'
                )}>
                  <TrendIcon size={16} />
                  {Math.abs(change)}%
                </span>
              )}
              {subtitle && (
                <span className={cn(
                  'text-sm',
                  variant === 'default' ? 'text-gray-500' : 'text-white/70'
                )}>
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            'p-3 rounded-xl',
            variant === 'default' ? 'bg-orange-100 text-orange-600' : 'bg-white/20 text-white'
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showValue = true,
  variant = 'default',
  size = 'md',
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const variants = {
    default: 'bg-orange-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-gray-600">{label}</span>}
          {showValue && <span className="text-sm font-medium text-gray-900">{percentage.toFixed(0)}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn('rounded-full transition-all duration-500', variants[variant], sizes[size])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
