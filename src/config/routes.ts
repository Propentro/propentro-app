/**
 * Org-relative path segments (no locale, no orgSlug prefix).
 * Used in sidebar menu items, breadcrumbs, and anywhere that
 * builds the final URL via next-intl Link + orgSlug prefix.
 */
export const paths = {
  home: '/',
  signIn: '/sign-in',
  selectWorkspace: '/select-workspace',
  accessDenied: '/access-denied',
  settings: {
    organization: '/settings/organization',
    members: '/settings/members',
    roles: '/settings/roles',
  },
  account: {
    root: '/account',
    profile: '/account/profile',
    preferences: '/account/preferences',
  },
} as const;

/**
 * Full URL builders — used for server-side redirects, middleware, etc.
 */
export const routes = {
  home: (locale: string, orgSlug: string) => `/${locale}/${orgSlug}`,
  signIn: (locale: string) => `/${locale}/${paths.signIn}`,
  selectWorkspace: (locale: string) => `/${locale}/${paths.selectWorkspace}`,
  accessDenied: (locale: string) => `/${locale}/${paths.accessDenied}`,
  settings: {
    organization: (locale: string, orgSlug: string) =>
      `/${locale}/${orgSlug}${paths.settings.organization}`,
    members: (locale: string, orgSlug: string) =>
      `/${locale}/${orgSlug}${paths.settings.members}`,
    roles: (locale: string, orgSlug: string) =>
      `/${locale}/${orgSlug}${paths.settings.roles}`,
  },
  account: {
    profile: (locale: string, orgSlug: string) =>
      `/${locale}/${orgSlug}${paths.account.profile}`,
    preferences: (locale: string, orgSlug: string) =>
      `/${locale}/${orgSlug}${paths.account.preferences}`,
  },
};
