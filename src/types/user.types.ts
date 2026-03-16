// ---------------------------------------------------------------------------
// /api/me response shape — mirrors what the .NET backend returns
// ---------------------------------------------------------------------------

export type Permission =
  // Organization Settings
  | 'org:settings:read'
  | 'org:settings:update'
  // Organization Members
  | 'org:members:read'
  | 'org:members:manage'
  // Organization Roles
  | 'org:roles:read'
  | 'org:roles:manage';

export type CurrentUser = {
  userId: string; // DB User ID
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string; // injected server-side from Clerk, not from backend
  organization: Organization;
  roles: string[];
  permissions: Permission[];
  isSystemAdmin: boolean;
};

export type Organization = {
  organizationId: string; // DB Org ID
  name: string;
  slug: string;
};
