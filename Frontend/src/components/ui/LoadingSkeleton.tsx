import React from 'react';

export const LoadingSkeleton: React.FC<{ count?: number; type?: 'card' | 'table' | 'detail' }> = ({
  count = 3,
  type = 'card',
}) => {
  if (type === 'table') {
    return (
      <div className="w-full space-y-3 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
        ))}
      </div>
    );
  }

  if (type === 'detail') {
    return (
      <div className="space-y-6 animate-pulse p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="space-y-2 pt-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/6" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4"
        >
          <div className="flex justify-between items-center">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-20" />
          </div>
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
};
