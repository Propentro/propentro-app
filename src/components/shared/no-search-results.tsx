import { SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

interface NoSearchResultsProps {
  onClearFilters: () => void;
}

export function NoSearchResults({ onClearFilters }: NoSearchResultsProps) {
  const t = useTranslations('common');

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted mb-4 flex size-12 items-center justify-center rounded-full">
        <SearchIcon className="text-muted-foreground size-6" />
      </div>
      <h3 className="text-lg font-medium">{t('noSearchResults.title')}</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        {t('noSearchResults.description')}
      </p>
      <Button variant="outline" className="mt-4" onClick={onClearFilters}>
        {t('table.clearFilters')}
      </Button>
    </div>
  );
}
