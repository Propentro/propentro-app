import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { ApiError, ListParams, PagedResult } from '@/types/api.types';

import type { AdminInvite } from '../types/admin.types';
import { adminKeys } from './admin-query-keys';

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

export function useAdminInvites(params: AdminInvitesParams = {}) {
  return useQuery(adminInvitesQueryOptions(params));
}

export function useAdminOrgInvites(orgPublicId: string) {
  return useQuery(adminOrgInvitesQueryOptions(orgPublicId));
}

export function useInviteUser(orgPublicId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    ApiError,
    { email: string; roleId: string }
  >({
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
