import type { Email, Id, ISODateTimeString } from '@/types/primitive.types';

// ---------------------------------------------------------------------------
// Embedded types (API response shapes)
// ---------------------------------------------------------------------------

export type MemberStatus = 'active' | 'deactivated';

export type OrgRole = {
  id: string;
  name: string;
  isSystem: boolean;
};

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type OrgMember = {
  userId: Id<'usr'>;
  email: Email;
  firstName: string;
  lastName: string;
  status: MemberStatus;
  joinedAt: ISODateTimeString;
  roles: OrgRole[];
};
