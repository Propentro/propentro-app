import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { ApiError, PagedResult } from '@/types/api.types';

import { adminKeys } from '../../hooks/admin-query-keys';
import type { AdminInvite } from '../../types';

// ---------------------------------------------------------------------------
// Query options factories
// ---------------------------------------------------------------------------

export const adminOrgInvitesQueryOptions = (orgPublicId: string) =>
  queryOptions({
    queryKey: adminKeys.organizations.invites(orgPublicId),
    queryFn: () =>
      apiClient.get<PagedResult<AdminInvite>>(
        `/admin/organizations/${orgPublicId}/invites`
      ),
    enabled: !!orgPublicId,
  });

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAdminOrgInvites(orgPublicId: string) {
  return useQuery(adminOrgInvitesQueryOptions(orgPublicId));
}

export function useInviteUser(orgPublicId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { email: string; roleId: string }>({
    mutationFn: (payload) =>
      apiClient.post<void>(
        `/admin/organizations/${orgPublicId}/invites`,
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.invites(orgPublicId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.invites.all(),
      });
    },
  });
}
