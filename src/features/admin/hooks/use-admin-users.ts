import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { ApiError, ListParams, PagedResult } from '@/types/api.types';

import type { AdminUser, AdminUserListItem } from '../types/admin.types';
import { adminKeys } from './admin-query-keys';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export type AdminUsersParams = ListParams & {
  status?: string;
};

// ---------------------------------------------------------------------------
// Query options factories
// ---------------------------------------------------------------------------

export const adminUsersQueryOptions = (params: AdminUsersParams = {}) =>
  queryOptions({
    queryKey: adminKeys.users.list(params),
    queryFn: () =>
      apiClient.get<PagedResult<AdminUserListItem>>('/admin/users', params),
  });

export const adminUserQueryOptions = (publicId: string) =>
  queryOptions({
    queryKey: adminKeys.users.detail(publicId),
    queryFn: () => apiClient.get<AdminUser>(`/admin/users/${publicId}`),
    enabled: !!publicId,
  });

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAdminUsers(params: AdminUsersParams = {}) {
  return useQuery(adminUsersQueryOptions(params));
}

export function useAdminUser(publicId: string) {
  return useQuery(adminUserQueryOptions(publicId));
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (publicId) =>
      apiClient.patch<void>(`/admin/users/${publicId}/deactivate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.users.all(),
      });
    },
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (publicId) =>
      apiClient.patch<void>(`/admin/users/${publicId}/reactivate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.users.all(),
      });
    },
  });
}
