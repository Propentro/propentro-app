'use client';

import { useUserContext } from '@/components/providers/user-provider';
import type { CurrentUser, Permission } from '@/types/user.types';

// ---------------------------------------------------------------------------
// useMe — primary hook for accessing the current user in client components.
//
// Reads from React context only — no fetch, no re-render on navigation.
// Works anywhere inside <UserProvider> (entire [orgSlug] subtree).
// Type-safe: returns CurrentUser (never null inside protected layout).
// ---------------------------------------------------------------------------

export function useMe(): CurrentUser {
  const user = useUserContext();

  if (!user) {
    throw new Error(
      '[useMe] No user found in context. ' +
        'Make sure you are inside <UserProvider>. ' +
        'This hook is only valid within the authenticated [orgSlug] layout.'
    );
  }

  return user;
}

// ---------------------------------------------------------------------------
// useHasPermission — client-side permission check from context.
//
// Client-side checks are for UI only (show/hide elements).
// Always enforce permissions server-side in Server Components and Server Actions.
// ---------------------------------------------------------------------------

export function useHasPermission(permission: Permission): boolean {
  const user = useUserContext();
  if (!user) return false;
  return user.permissions.includes(permission);
}
