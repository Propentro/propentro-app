import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type { InviteMemberInput } from '@/features/settings/members/validators/create-user.schema';
import { apiClient } from '@/lib/api-client';
import type { ApiError, PagedResult } from '@/types/api.types';

import { adminKeys } from '../../hooks/admin-query-keys';
import type { AdminInvite, InviteResult } from '../../types';

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

  return useMutation<InviteResult, ApiError, InviteMemberInput>({
    mutationFn: (payload) =>
      apiClient.post<InviteResult>(
        `/admin/organizations/${orgPublicId}/invites`,
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.invites(orgPublicId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.members(orgPublicId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.detail(orgPublicId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.invites.all(),
      });
    },
  });
}
