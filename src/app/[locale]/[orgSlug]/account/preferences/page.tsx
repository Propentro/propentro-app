import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LanguageSelector } from '@/features/account/preferences/components/language-selector';
import { ThemePicker } from '@/features/account/preferences/components/theme-picker';

export const metadata: Metadata = { title: 'Preferences | Propentro' };

export default async function PreferencesPage() {
  const t = await getTranslations('account.preferences');

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('description')}
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <h3 className="text-sm font-semibold">{t('theme.title')}</h3>
        <p className="text-muted-foreground mt-1 mb-4 text-sm">
          {t('theme.description')}
        </p>
        <ThemePicker />
      </div>

      <div className="rounded-lg border p-6">
        <h3 className="text-sm font-semibold">{t('language.title')}</h3>
        <p className="text-muted-foreground mt-1 mb-4 text-sm">
          {t('language.description')}
        </p>
        <LanguageSelector />
      </div>
    </div>
  );
}
