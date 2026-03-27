'use client';

import { cn } from '@/lib/utils/format';

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn('border-b border-slate-200', className)}>
      <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              'whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'ml-2 rounded-full px-2 py-0.5 text-xs font-medium',
                  activeTab === tab.key
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

export { Tabs };
export type { TabsProps, Tab };
