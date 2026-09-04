import React from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, Clock, XCircle, AlertTriangle, Sparkles, Building2, Layers, CheckCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, size = 'md' }) => {
  const getStatusConfig = (s: string) => {
    const lower = s?.toLowerCase() || '';

    if (lower.includes('validated') || lower === 'accepted' || lower === 'approved' || lower === 'completed') {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        icon: CheckCircle2,
      };
    }
    if (lower.includes('pending') || lower.includes('under review') || lower === 'submitted' || lower === 'draft') {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        icon: Clock,
      };
    }
    if (lower.includes('reject')) {
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        icon: XCircle,
      };
    }
    if (lower.includes('collaboration ready') || lower.includes('matched')) {
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        icon: Sparkles,
      };
    }
    if (lower.includes('changes requested')) {
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        icon: AlertTriangle,
      };
    }
    if (lower.includes('in project') || lower.includes('active') || lower === 'prototype' || lower === 'pilot' || lower === 'testing' || lower === 'deployment') {
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        icon: Layers,
      };
    }
    if (lower === 'resolved') {
      return {
        bg: 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
        icon: CheckCheck,
      };
    }

    return {
      bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      icon: Building2,
    };
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-medium gap-1',
    md: 'px-2.5 py-1 text-xs font-semibold gap-1.5',
    lg: 'px-3 py-1.5 text-sm font-semibold gap-2',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border transition-all duration-150 shadow-xs',
        config.bg,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={clsx(size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5')} />
      <span>{status}</span>
    </span>
  );
};
