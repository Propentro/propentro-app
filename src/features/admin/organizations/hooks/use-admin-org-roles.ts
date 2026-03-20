import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

import { adminKeys } from '../../hooks/admin-query-keys';

export type AdminOrgRole = {
  roleId: string;
  name: string;
  isSystem: boolean;
};

export const adminOrgRolesQueryOptions = (orgPublicId: string) =>
  queryOptions({
    queryKey: adminKeys.organizations.roles(orgPublicId),
    queryFn: () =>
      apiClient.get<AdminOrgRole[]>(
        `/admin/organizations/${orgPublicId}/roles`
      ),
    enabled: !!orgPublicId,
  });

export function useAdminOrgRoles(orgPublicId: string) {
  return useQuery(adminOrgRolesQueryOptions(orgPublicId));
}
