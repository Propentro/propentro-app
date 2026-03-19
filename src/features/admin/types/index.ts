import type { ISODateTimeString } from '@/types/primitive.types';

// ---------------------------------------------------------------------------
// Organisations
// ---------------------------------------------------------------------------

export type AdminOrganization = {
  organizationId: string;
  name: string;
  slug: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  currencyCode: string;
  timezone: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
  legalName?: string;
  taxNumber?: string;
  taxCountry?: string;
  isActive: boolean;
  memberCount: number;
  createdAt: ISODateTimeString;
};

export type AdminOrganizationListItem = {
  organizationId: string;
  name: string;
  slug: string;
  isActive: boolean;
  memberCount: number;
  createdAt: ISODateTimeString;
};

export type CreateOrganizationInput = {
  name: string;
  slug: string;
  currencyCode: string;
  timezone: string;
};

export type UpdateOrganizationInput = {
  name: string;
  slug: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  currencyCode: string;
  timezone: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
  legalName?: string;
  taxNumber?: string;
  taxCountry?: string;
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export type AdminUser = {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: ISODateTimeString;
  organizations: UserOrganizationInfo[];
};

export type AdminUserListItem = {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  organizationCount: number;
  createdAt: ISODateTimeString;
};

export type MemberRoleInfo = {
  id: string;
  name: string;
};

export type UserOrganizationInfo = {
  organizationId: string;
  name: string;
  status: string;
  joinedAt: ISODateTimeString;
  roles: MemberRoleInfo[];
};

// ---------------------------------------------------------------------------
// Invites
// ---------------------------------------------------------------------------

export type AdminInvite = {
  inviteId: string;
  organizationId: string;
  organizationName: string;
  email: string;
  roleName: string;
  status: string;
  invitedBy?: string;
  expiresAt?: ISODateTimeString;
  createdAt: ISODateTimeString;
};

export type InviteResult = {
  isDirectAdd: boolean;
  memberId?: string;
  inviteId?: string;
};

// ---------------------------------------------------------------------------
// Members (org-scoped in admin context)
// ---------------------------------------------------------------------------

export type AdminMember = {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: string; // 'active' | 'deactivated'
  roles: MemberRoleInfo[];
  joinedAt: ISODateTimeString;
};

// ---------------------------------------------------------------------------
// Admin Me (profile)
// ---------------------------------------------------------------------------

export type AdminMe = {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  adminRole: string;
  assignedAt: ISODateTimeString;
};

// ---------------------------------------------------------------------------
// Invite status badge variant helper
// ---------------------------------------------------------------------------

export function inviteStatusVariant(
  status: string
): 'default' | 'warning' | 'outline' {
  switch (status.toLowerCase()) {
    case 'accepted':
      return 'default';
    case 'pending':
      return 'warning';
    case 'canceled':
    case 'expired':
      return 'outline';
    default:
      return 'outline';
  }
}
