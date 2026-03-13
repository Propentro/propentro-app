// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type OrgRoleItem = {
  roleId: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  memberCount: number;
  permissionCodes: string[];
};

// ---------------------------------------------------------------------------
// Permissions types
// ---------------------------------------------------------------------------

export type PermissionItem = {
  code: string;
  description: string | null;
};

export type PermissionGroup = {
  group: string;
  permissions: PermissionItem[];
};
