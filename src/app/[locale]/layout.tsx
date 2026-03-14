import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from 'sonner';

import NextProgress from '@/components/next-progress';
import { AuthProvider } from '@/components/providers/auth-provider';
import { JotaiProvider } from '@/components/providers/jotai-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { routing } from '@/i18n/routing';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            <NextProgress />
            <TooltipProvider>
              <JotaiProvider>
                {children}
                <Toaster position="top-right" richColors />
              </JotaiProvider>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </NextIntlClientProvider>
  );
}
