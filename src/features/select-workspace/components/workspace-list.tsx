'use client';

import { useOrganizationList } from '@clerk/nextjs';

import { Card, CardContent } from '@/components/ui/card';
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
}: {
  orgs: Org[];
  locale: string;
}) {
  const { setActive } = useOrganizationList();
  const router = useRouter();

  const handleSelect = async (org: Org) => {
    if (setActive) {
      await setActive({ organization: org.id });
      router.push(`/${org.slug}`);
    }
  };

  return (
    <div className="grid w-full max-w-md gap-3">
      {orgs.map((org) => (
        <Card
          key={org.id}
          className="cursor-pointer transition-colors hover:bg-accent"
          onClick={() => handleSelect(org)}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded font-semibold">
              {org.name[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="font-medium">{org.name}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
