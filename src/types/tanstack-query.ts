import type { ApiError } from '@/types/api.types';

/**
 * Registers ApiError as the default error type for all TanStack Query hooks.
 * Without this, `error` would be typed as `Error` everywhere.
 *
 * After this: every useQuery / useMutation automatically gets `error: ApiError | null`
 */
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError;
  }
}
