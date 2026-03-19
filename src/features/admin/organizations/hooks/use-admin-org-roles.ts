import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { PagedResult } from '@/types/api.types';

import { adminKeys } from '../../hooks/admin-query-keys';

export type AdminOrgRole = {
  roleId: string;
  name: string;
};

export const adminOrgRolesQueryOptions = (orgPublicId: string) =>
  queryOptions({
    queryKey: adminKeys.organizations.roles(orgPublicId),
    queryFn: () =>
      apiClient.get<PagedResult<AdminOrgRole>>(
        `/admin/organizations/${orgPublicId}/roles`
      ),
    enabled: !!orgPublicId,
  });

export function useAdminOrgRoles(orgPublicId: string) {
  return useQuery(adminOrgRolesQueryOptions(orgPublicId));
}
