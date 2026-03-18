import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { ApiError } from '@/types/api.types';

import { adminKeys } from './admin-query-keys';

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useRemoveMember(orgPublicId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (userPublicId) =>
      apiClient.delete<void>(
        `/admin/organizations/${orgPublicId}/members/${userPublicId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.members(orgPublicId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.detail(orgPublicId),
      });
    },
  });
}

export function useAdminDeactivateMember(orgPublicId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (userPublicId) =>
      apiClient.patch<void>(
        `/admin/organizations/${orgPublicId}/members/${userPublicId}/deactivate`,
        {}
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.members(orgPublicId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.detail(orgPublicId),
      });
    },
  });
}

export function useAdminReactivateMember(orgPublicId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (userPublicId) =>
      apiClient.patch<void>(
        `/admin/organizations/${orgPublicId}/members/${userPublicId}/reactivate`,
        {}
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.members(orgPublicId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.detail(orgPublicId),
      });
    },
  });
}
