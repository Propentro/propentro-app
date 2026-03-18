import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { ApiError, ListParams, PagedResult } from '@/types/api.types';

import { adminKeys } from '../../hooks/admin-query-keys';
import type { AdminInvite } from '../../types';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export type AdminInvitesParams = ListParams & {
  status?: string;
};

// ---------------------------------------------------------------------------
// Query options factories
// ---------------------------------------------------------------------------

export const adminInvitesQueryOptions = (params: AdminInvitesParams = {}) =>
  queryOptions({
    queryKey: adminKeys.invites.list(params),
    queryFn: () =>
      apiClient.get<PagedResult<AdminInvite>>('/admin/invites', params),
  });

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAdminInvites(params: AdminInvitesParams = {}) {
  return useQuery(adminInvitesQueryOptions(params));
}

export function useCancelInvite() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (invitePublicId) =>
      apiClient.patch<void>(`/admin/invites/${invitePublicId}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.invites.all(),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.all(),
      });
    },
  });
}
