'use client';

import { createContext, useContext } from 'react';

import type { CurrentUser } from '@/types/user.types';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const UserContext = createContext<CurrentUser | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function UserProvider({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

// ---------------------------------------------------------------------------
// Internal hook — do not export directly. Use useMe() from @/hooks/use-me.
// ---------------------------------------------------------------------------

export function useUserContext(): CurrentUser | null {
  return useContext(UserContext);
}
