import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { useSession } from '@/hooks/use-session';
import { apiClient } from '@/lib/api-client';
import { orgKeys } from '@/lib/query-keys';
import type { ApiError } from '@/types/api.types';

import type { OrgInvite } from '../types';

// ---------------------------------------------------------------------------
// Query options factory
// ---------------------------------------------------------------------------

export const invitesQueryOptions = (orgId: string | null | undefined) =>
  queryOptions({
    queryKey: orgKeys.scope(orgId, 'invites'),
    queryFn: () => apiClient.get<OrgInvite[]>('/organizations/invites'),
    enabled: !!orgId,
  });

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useOrgInvites() {
  const { clerkOrgId } = useSession();
  return useQuery(invitesQueryOptions(clerkOrgId));
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
