import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type {
  OrgSettingsInput,
  OrgSettingsOutput,
} from '@/features/settings/organization/validators/org-settings.schema';
import { useSession } from '@/hooks/use-session';
import { apiClient } from '@/lib/api-client';
import { orgKeys } from '@/lib/query-keys';
import type { ApiError } from '@/types/api.types';

// ---------------------------------------------------------------------------
// Query options factory (reusable for prefetching)
// ---------------------------------------------------------------------------

export const orgSettingsQueryOptions = (orgId: string | null | undefined) =>
  queryOptions({
    queryKey: orgKeys.scope(orgId, 'settings'),
    queryFn: () => apiClient.get<OrgSettingsOutput>('/organizations/settings'),
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

// ---------------------------------------------------------------------------
// Mapper — API response → form state
// ---------------------------------------------------------------------------

export function toOrgSettingsInput(data: OrgSettingsOutput): OrgSettingsInput {
  return {
    name: data.name,
    contactName: data.contactName ?? '',
    contactEmail: data.contactEmail ?? '',
    contactPhone: data.contactPhone ?? '',
    addressLine1: data.addressLine1 ?? '',
    addressLine2: data.addressLine2 ?? '',
    city: data.city ?? '',
    region: data.region ?? '',
    postalCode: data.postalCode ?? '',
    countryCode: data.countryCode ?? '',
    legalName: data.legalName ?? '',
    taxNumber: data.taxNumber ?? '',
    taxCountry: data.taxCountry ?? '',
    currencyCode: data.currencyCode,
    timezone: data.timezone,
  };
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useOrgSettings() {
  const { clerkOrgId } = useSession();
  return useQuery(orgSettingsQueryOptions(clerkOrgId));
}

export function useUpdateOrgSettings() {
  const { clerkOrgId } = useSession();
  const queryClient = useQueryClient();

  return useMutation<OrgSettingsOutput, ApiError, OrgSettingsOutput>({
    mutationFn: (data) =>
      apiClient.patch<OrgSettingsOutput>('/organizations/settings', data),
    onSuccess: (data) => {
      queryClient.setQueryData(orgKeys.scope(clerkOrgId, 'settings'), data);
    },
  });
}
