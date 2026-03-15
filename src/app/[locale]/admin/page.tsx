import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = { title: 'Platform Admin | Propentro' };

export default async function AdminOverviewPage() {
  const t = await getTranslations('admin');

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="text-muted-foreground">{t('description')}</p>
    </div>
  );
}
