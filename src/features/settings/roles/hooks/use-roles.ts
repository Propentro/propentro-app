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

import type { OrgRoleItem, PermissionGroup } from '../types';
import type {
  CreateRoleOutput,
  UpdateRoleOutput,
} from '../validators/role.schema';

// ---------------------------------------------------------------------------
// Query options factories (reusable for prefetching)
// ---------------------------------------------------------------------------

export const rolesQueryOptions = (orgId: string | null | undefined) =>
  queryOptions({
    queryKey: orgKeys.scope(orgId, 'roles'),
    queryFn: () => apiClient.get<OrgRoleItem[]>('/organizations/roles'),
    enabled: !!orgId,
  });

export const permissionsQueryOptions = (orgId: string | null | undefined) =>
  queryOptions({
    queryKey: orgKeys.scope(orgId, 'permissions'),
    queryFn: () =>
      apiClient.get<PermissionGroup[]>('/organizations/permissions'),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useRoles() {
  const { clerkOrgId } = useSession();
  return useQuery(rolesQueryOptions(clerkOrgId));
}

export function usePermissions() {
  const { clerkOrgId } = useSession();
  return useQuery(permissionsQueryOptions(clerkOrgId));
}

export function useCreateRole() {
  const { clerkOrgId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, CreateRoleOutput>({
    mutationFn: (payload) =>
      apiClient.post<void>('/organizations/roles', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orgKeys.scope(clerkOrgId, 'roles'),
      });
    },
  });
}

export function useUpdateRole() {
  const { clerkOrgId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { roleId: string } & UpdateRoleOutput>({
    mutationFn: ({ roleId, ...payload }) =>
      apiClient.patch<void>(`/organizations/roles/${roleId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orgKeys.scope(clerkOrgId, 'roles'),
      });
      queryClient.invalidateQueries({
        queryKey: orgKeys.scope(clerkOrgId, 'members'),
      });
    },
  });
}

export function useDeleteRole() {
  const { clerkOrgId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (roleId) =>
      apiClient.delete<void>(`/organizations/roles/${roleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orgKeys.scope(clerkOrgId, 'roles'),
      });
      queryClient.invalidateQueries({
        queryKey: orgKeys.scope(clerkOrgId, 'members'),
      });
    },
  });
}
