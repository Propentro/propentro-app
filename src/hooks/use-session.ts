'use client';

import { useAuth } from '@clerk/nextjs';

/**
 * Auth-provider-agnostic session hook.
 *
 * This is the ONLY place in the codebase that imports @clerk/nextjs for auth state.
 * Switching auth providers only requires updating this one file.
 *
 * Naming is intentionally explicit to avoid confusion with DB IDs:
 *   clerkOrgId  ≠ organization.organizationId  (DB Org UUID)
 *   clerkUserId ≠ userId                       (DB User UUID)
 *
 * Use clerkOrgId for: query cache keys, workspace scoping.
 * Use useMe() for:    user data, permissions, display name, DB IDs.
 */
export function useSession() {
  const { orgId, userId, isLoaded, isSignedIn } = useAuth();
  return {
    clerkOrgId: orgId,
    clerkUserId: userId,
    isLoaded,
    isSignedIn,
  };
}
