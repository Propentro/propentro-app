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

export type AdminOrganisationsParams = ListParams & {
  status?: string;
};

// ---------------------------------------------------------------------------
// Query options factories
// ---------------------------------------------------------------------------

export const adminOrganisationsQueryOptions = (
  params: AdminOrganisationsParams = {}
) =>
  queryOptions({
    queryKey: adminKeys.organisations.list(params),
    queryFn: () =>
      apiClient.get<PagedResult<AdminOrganizationListItem>>(
        '/admin/organisations',
        params
      ),
  });

export const adminOrganisationQueryOptions = (publicId: string) =>
  queryOptions({
    queryKey: adminKeys.organisations.detail(publicId),
    queryFn: () =>
      apiClient.get<AdminOrganization>(`/admin/organisations/${publicId}`),
    enabled: !!publicId,
  });

export const adminOrgMembersQueryOptions = (publicId: string) =>
  queryOptions({
    queryKey: adminKeys.organisations.members(publicId),
    queryFn: () =>
      apiClient.get<AdminMember[]>(
        `/admin/organisations/${publicId}/members`
      ),
    enabled: !!publicId,
  });

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAdminOrganisations(params: AdminOrganisationsParams = {}) {
  return useQuery(adminOrganisationsQueryOptions(params));
}

export function useAdminOrganisation(publicId: string) {
  return useQuery(adminOrganisationQueryOptions(publicId));
}

export function useAdminOrgMembers(publicId: string) {
  return useQuery(adminOrgMembersQueryOptions(publicId));
}

export function useCreateOrganisation() {
  const queryClient = useQueryClient();

  return useMutation<AdminOrganization, ApiError, CreateOrganizationInput>({
    mutationFn: (payload) =>
      apiClient.post<AdminOrganization>('/admin/organisations', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.organisations.all(),
      });
    },
  });
}

export function useUpdateOrganisation(publicId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, UpdateOrganizationInput>({
    mutationFn: (payload) =>
      apiClient.put<void>(`/admin/organisations/${publicId}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.organisations.all(),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organisations.detail(publicId),
      });
    },
  });
}

export function useDeactivateOrganisation() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (publicId) =>
      apiClient.delete<void>(`/admin/organisations/${publicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.organisations.all(),
      });
    },
  });
}
