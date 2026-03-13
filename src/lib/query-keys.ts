/**
 * Org-scoped query key factory.
 *
 * All server data in this app belongs to an org. This factory guarantees
 * every query key includes the orgId, preventing data leakage across orgs.
 *
 * Hierarchy (TanStack partial matching works top-down):
 *   orgKeys.root                          → ['org']
 *   orgKeys.all(orgId)                    → ['org', orgId]
 *   orgKeys.scope(orgId, 'settings')      → ['org', orgId, 'settings']
 *   orgKeys.scope(orgId, 'properties', id)→ ['org', orgId, 'properties', id]
 *
 * Common patterns:
 *   // Remove ALL org data (select-workspace / sign-out)
 *   queryClient.removeQueries({ queryKey: orgKeys.root })
 *
 *   // Remove a specific org's data (workspace switcher)
 *   queryClient.removeQueries({ queryKey: orgKeys.all(orgId) })
 *
 *   // Feature query key
 *   queryKey: orgKeys.scope(orgId, 'settings')
 */
export const orgKeys = {
  root: ['org'] as const,

  all: (orgId: string | null | undefined) =>
    ['org', orgId] as const,

  scope: (orgId: string | null | undefined, ...segments: readonly string[]) =>
    ['org', orgId, ...segments] as const,
};
