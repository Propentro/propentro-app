'use client';

import { useOrganizationList } from '@clerk/nextjs';
import { ShieldIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { paths } from '@/config/routes';
import { useRouter } from '@/i18n/routing';

type Org = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
};

export function WorkspaceList({
  orgs,
  locale: _locale,
  isSuperAdmin = false,
}: {
  orgs: Org[];
  locale: string;
  isSuperAdmin?: boolean;
}) {
  const { setActive } = useOrganizationList();
  const router = useRouter();
  const t = useTranslations('workspace');

  const handleSelect = async (org: Org) => {
    if (setActive) {
      await setActive({ organization: org.id });
      router.push(`/${org.slug}${paths.home}`);
    }
  };

  const handleAdminClick = () => {
    router.push(paths.admin.root);
  };

  return (
    <div className="grid w-full max-w-md gap-3">
      {isSuperAdmin && (
        <Card
          className="hover:bg-accent cursor-pointer border-dashed transition-colors"
          onClick={handleAdminClick}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded">
              <ShieldIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{t('platformAdmin')}</span>
                <Badge variant="secondary">Admin</Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                {t('platformAdminDescription')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {orgs.map((org) => (
        <Card
          key={org.id}
          className="hover:bg-accent cursor-pointer transition-colors"
          onClick={() => handleSelect(org)}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded font-semibold">
              {org.name[0].toUpperCase()}
            </div>
            <span className="font-medium">{org.name}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
