'use client';

import { useOrganization, useOrganizationList } from '@clerk/nextjs';

/**
 * Wraps Clerk's organization hooks into a single, swap-friendly hook.
 * Only used by the workspace switcher. If Clerk changes, only this file
 * and auth-provider need updating.
 */
export function useOrganizations() {
  const { organization: activeOrganization, isLoaded: isOrgLoaded } =
    useOrganization();

  const {
    userMemberships,
    setActive,
    isLoaded: isListLoaded,
  } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  return {
    activeOrganization,
    userMemberships,
    setActive,
    isLoaded: isOrgLoaded && isListLoaded,
  };
}
