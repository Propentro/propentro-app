'use client';

import { enGB } from '@clerk/localizations';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useLocale } from 'next-intl';
import { useTheme } from 'next-themes';

import { useMounted } from '@/hooks/use-mounted';

const clerkLocales: Record<string, typeof enGB> = {
  en: enGB,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const locale = useLocale();
  const mounted = useMounted();

  return (
    <ClerkProvider
      localization={clerkLocales[locale] || enGB}
      appearance={{
        baseTheme: mounted && resolvedTheme === 'dark' ? dark : undefined,
      }}
    >
      {children}
    </ClerkProvider>
  );
}
