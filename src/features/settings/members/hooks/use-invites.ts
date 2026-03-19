import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { useSession } from '@/hooks/use-session';
import { apiClient } from '@/lib/api-client';
import { orgKeys } from '@/lib/query-keys';
import type { ApiError, ListParams, PagedResult } from '@/types/api.types';

import type { OrgInvite } from '../types';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export type InvitesParams = ListParams & {
  status?: string;
};

// ---------------------------------------------------------------------------
// Query options factory
// ---------------------------------------------------------------------------

export const invitesQueryOptions = (
  orgId: string | null | undefined,
  params: InvitesParams = {}
) =>
  queryOptions({
    queryKey: [...orgKeys.scope(orgId, 'invites'), params] as const,
    queryFn: () =>
      apiClient.get<PagedResult<OrgInvite>>(
        '/organizations/invites',
        params
      ),
    enabled: !!orgId,
  });

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useOrgInvites(params: InvitesParams = {}) {
  const { clerkOrgId } = useSession();
  return useQuery(invitesQueryOptions(clerkOrgId, params));
}

export function useCancelInvite() {
  const { clerkOrgId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (invitePublicId) =>
      apiClient.patch<void>(
        `/organizations/invites/${invitePublicId}/cancel`,
        {}
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orgKeys.scope(clerkOrgId, 'invites'),
      });
      queryClient.invalidateQueries({
        queryKey: orgKeys.scope(clerkOrgId, 'members'),
      });
    },
  });
}
