/**
 * Admin query key factory.
 *
 * Admin data is NOT org-scoped, so we use a flat ['admin', ...] prefix
 * instead of the org-scoped orgKeys pattern.
 */
export const adminKeys = {
  root: ['admin'] as const,

  organizations: {
    all: () => ['admin', 'organizations'] as const,
    list: (params: Record<string, unknown>) =>
      ['admin', 'organizations', 'list', params] as const,
    detail: (publicId: string) =>
      ['admin', 'organizations', publicId] as const,
    members: (publicId: string) =>
      ['admin', 'organizations', publicId, 'members'] as const,
    invites: (publicId: string) =>
      ['admin', 'organizations', publicId, 'invites'] as const,
  },

  users: {
    all: () => ['admin', 'users'] as const,
    list: (params: Record<string, unknown>) =>
      ['admin', 'users', 'list', params] as const,
    detail: (publicId: string) => ['admin', 'users', publicId] as const,
  },

  invites: {
    all: () => ['admin', 'invites'] as const,
    list: (params: Record<string, unknown>) =>
      ['admin', 'invites', 'list', params] as const,
  },
};
