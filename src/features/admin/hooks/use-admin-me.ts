import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

import type { AdminMe } from '../types/admin.types';
import { adminKeys } from './admin-query-keys';

export const adminMeQueryOptions = () =>
  queryOptions({
    queryKey: adminKeys.me(),
    queryFn: () => apiClient.get<AdminMe>('/admin/me'),
  });

export function useAdminMe() {
  return useQuery(adminMeQueryOptions());
}
