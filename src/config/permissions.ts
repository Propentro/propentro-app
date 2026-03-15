import type { Permission } from '@/types/user.types';

export const PERMISSIONS = {
  settings: {
    read: 'org:settings:read' as Permission,
    update: 'org:settings:update' as Permission,
  },
  members: {
    read: 'org:members:read' as Permission,
    manage: 'org:members:manage' as Permission,
  },
  roles: {
    read: 'org:roles:read' as Permission,
    manage: 'org:roles:manage' as Permission,
  },
} as const;

/** All read permissions used to determine if Settings sidebar link is visible. */
export const ANY_SETTINGS_READ_PERMISSION: Permission[] = [
  PERMISSIONS.settings.read,
  PERMISSIONS.members.read,
  PERMISSIONS.roles.read,
];
