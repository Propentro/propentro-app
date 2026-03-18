import { PERMISSIONS } from '@/config/permissions';
import { paths } from '@/config/routes';
import { redirect } from '@/i18n/routing';
import { hasPermission } from '@/lib/auth';

interface Props {
  params: Promise<{ locale: string; orgSlug: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { locale, orgSlug } = await params;

  const permissionToPath = [
    {
      permission: PERMISSIONS.settings.read,
      path: paths.settings.organization,
    },
    { permission: PERMISSIONS.members.read, path: paths.settings.members },
    { permission: PERMISSIONS.roles.read, path: paths.settings.roles },
  ];

  for (const { permission, path } of permissionToPath) {
    if (await hasPermission(permission)) {
      redirect({ href: `/${orgSlug}${path}`, locale });
    }
  }

  redirect({ href: '/access-denied', locale });
}
