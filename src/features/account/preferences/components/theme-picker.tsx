'use client';

import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/utils';

const themes = [
  {
    value: 'light' as const,
    icon: Sun,
    previewBg: 'bg-gray-100',
    previewBar: 'bg-white',
  },
  {
    value: 'dark' as const,
    icon: Moon,
    previewBg: 'bg-gray-900',
    previewBar: 'bg-gray-800',
  },
  {
    value: 'system' as const,
    icon: Monitor,
    previewBg: 'bg-gradient-to-r from-gray-100 from-50% to-gray-900 to-50%',
    previewBar:
      'bg-gradient-to-r from-white from-50% to-gray-800 to-50%',
  },
];

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('account.preferences.theme');

  return (
    <div className="grid grid-cols-3 gap-3">
      {themes.map(({ value, icon: Icon, previewBg, previewBar }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={cn(
              'flex-1 cursor-pointer overflow-hidden rounded-lg border-2 transition-colors',
              isActive
                ? 'border-primary ring-primary/20 ring-2'
                : 'border-border hover:border-muted-foreground/30'
            )}
          >
            <div className={cn('p-3 space-y-1.5', previewBg)}>
              <div className={cn('h-1.5 w-full rounded', previewBar)} />
              <div className={cn('h-1.5 w-3/5 rounded', previewBar)} />
            </div>
            <div className="flex items-center justify-center gap-1.5 p-2">
              {isActive ? (
                <Check className="text-primary size-3.5" />
              ) : (
                <Icon className="text-muted-foreground size-3.5" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {t(value)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
