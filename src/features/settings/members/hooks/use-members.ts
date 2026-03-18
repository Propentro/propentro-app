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

import type { OrgMember } from '../types';
import type {
  InviteMemberInput,
  UpdateMemberRolesInput,
} from '../validators/create-user.schema';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export type MembersParams = ListParams & {
  status?: string;
  roleId?: string;
};

// ---------------------------------------------------------------------------
// Query options factory (reusable for prefetching)
// ---------------------------------------------------------------------------

export const membersQueryOptions = (
  orgId: string | null | undefined,
  params: MembersParams = {}
) =>
  queryOptions({
    queryKey: [...orgKeys.scope(orgId, 'members'), params] as const,
    queryFn: () =>
      apiClient.get<PagedResult<OrgMember>>('/organizations/members', params),
    enabled: !!orgId,
  });

export const memberQueryOptions = (
  orgId: string | null | undefined,
  userId: string
) =>
  queryOptions({
    queryKey: [...orgKeys.scope(orgId, 'members'), userId] as const,
    queryFn: () => apiClient.get<OrgMember>(`/organizations/members/${userId}`),
    enabled: !!orgId && !!userId,
  });

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useMember(userId: string) {
  const { clerkOrgId } = useSession();
  return useQuery(memberQueryOptions(clerkOrgId, userId));
}

export function useMembers(params: MembersParams = {}) {
  const { clerkOrgId } = useSession();
  return useQuery(membersQueryOptions(clerkOrgId, params));
}

export function useInviteMember() {
  const { clerkOrgId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, InviteMemberInput>({
    mutationFn: (payload) =>
      apiClient.post<void>('/organizations/invites', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orgKeys.scope(clerkOrgId, 'members'),
      });
      queryClient.invalidateQueries({
        queryKey: orgKeys.scope(clerkOrgId, 'roles'),
      });
      queryClient.invalidateQueries({
        queryKey: orgKeys.scope(clerkOrgId, 'invites'),
      });
    },
  });
}

export function useUpdateMemberRoles() {
  const { clerkOrgId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<
    void,
    ApiError,
    { userId: string } & UpdateMemberRolesInput
  >({
    mutationFn: ({ userId, roleIds }) =>
      apiClient.patch<void>(`/organizations/members/${userId}/roles`, {
        roleIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orgKeys.scope(clerkOrgId, 'members'),
      });
      queryClient.invalidateQueries({
        queryKey: orgKeys.scope(clerkOrgId, 'roles'),
      });
    },
  });
}

export function useDeactivateMember() {
  const { clerkOrgId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (userId) =>
      apiClient.patch<void>(`/organizations/members/${userId}/deactivate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orgKeys.scope(clerkOrgId, 'members'),
      });
    },
  });
}

export function useReactivateMember() {
  const { clerkOrgId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (userId) =>
      apiClient.patch<void>(`/organizations/members/${userId}/reactivate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orgKeys.scope(clerkOrgId, 'members'),
      });
    },
  });
}
