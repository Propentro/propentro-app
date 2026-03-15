import type { ApiError } from '@/types/api.types';

/**
 * Extracts a human-readable message from an ApiError.
 *
 * Handles cases where `detail` is a JSON string (e.g., Clerk error envelope)
 * by extracting the first `long_message` or `message` from the errors array.
 */
export function getErrorMessage(error: ApiError, fallback: string): string {
  const { detail } = error;
  if (!detail) return fallback;

  if (detail.startsWith('{') || detail.startsWith('[')) {
    try {
      const parsed = JSON.parse(detail);

      // Clerk error envelope: { errors: [{ long_message, message }] }
      if (parsed.errors && Array.isArray(parsed.errors)) {
        const firstError = parsed.errors[0];
        return firstError?.long_message ?? firstError?.message ?? fallback;
      }

      if (typeof parsed.message === 'string') return parsed.message;
      if (typeof parsed.detail === 'string') return parsed.detail;
    } catch {
      // Not valid JSON — fall through
    }
  }

  return detail;
}
