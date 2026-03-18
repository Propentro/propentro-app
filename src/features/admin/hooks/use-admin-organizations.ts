import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import type { ApiError, ListParams, PagedResult } from '@/types/api.types';

import type {
  AdminMember,
  AdminOrganization,
  AdminOrganizationListItem,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from '../types/admin.types';
import { adminKeys } from './admin-query-keys';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export type AdminOrganizationsParams = ListParams & {
  status?: string;
};

// ---------------------------------------------------------------------------
// Query options factories
// ---------------------------------------------------------------------------

export const adminOrganizationsQueryOptions = (
  params: AdminOrganizationsParams = {}
) =>
  queryOptions({
    queryKey: adminKeys.organizations.list(params),
    queryFn: () =>
      apiClient.get<PagedResult<AdminOrganizationListItem>>(
        '/admin/organizations',
        params
      ),
  });

export const adminOrganizationQueryOptions = (publicId: string) =>
  queryOptions({
    queryKey: adminKeys.organizations.detail(publicId),
    queryFn: () =>
      apiClient.get<AdminOrganization>(`/admin/organizations/${publicId}`),
    enabled: !!publicId,
  });

export const adminOrgMembersQueryOptions = (publicId: string) =>
  queryOptions({
    queryKey: adminKeys.organizations.members(publicId),
    queryFn: () =>
      apiClient.get<PagedResult<AdminMember>>(
        `/admin/organizations/${publicId}/members`
      ),
    enabled: !!publicId,
  });

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAdminOrganizations(params: AdminOrganizationsParams = {}) {
  return useQuery(adminOrganizationsQueryOptions(params));
}

export function useAdminOrganization(publicId: string) {
  return useQuery(adminOrganizationQueryOptions(publicId));
}

export function useAdminOrgMembers(publicId: string) {
  return useQuery(adminOrgMembersQueryOptions(publicId));
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation<AdminOrganization, ApiError, CreateOrganizationInput>({
    mutationFn: (payload) =>
      apiClient.post<AdminOrganization>('/admin/organizations', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.all(),
      });
    },
  });
}

export function useUpdateOrganization(publicId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, UpdateOrganizationInput>({
    mutationFn: (payload) =>
      apiClient.patch<void>(`/admin/organizations/${publicId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.all(),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.detail(publicId),
      });
    },
  });
}

export function useDeactivateOrganization() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (publicId) =>
      apiClient.patch<void>(`/admin/organizations/${publicId}/deactivate`, {}),
    onSuccess: (_data, publicId) => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.all(),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.detail(publicId),
      });
    },
  });
}

export function useReactivateOrganization() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (publicId) =>
      apiClient.patch<void>(
        `/admin/organizations/${publicId}/reactivate`,
        {}
      ),
    onSuccess: (_data, publicId) => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.all(),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.detail(publicId),
      });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { publicId: string }>({
    mutationFn: ({ publicId }) =>
      apiClient.delete<void>(`/admin/organizations/${publicId}`, {
        'X-Confirm-Delete': publicId,
      }),
    onSuccess: (_data, { publicId }) => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.all(),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.detail(publicId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.members(publicId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.invites(publicId),
      });
    },
  });
}
