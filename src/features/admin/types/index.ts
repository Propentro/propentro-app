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
  subscriptionPlan: string;
  isActive: boolean;
  memberCount: number;
  createdAt: ISODateTimeString;
};

export type AdminOrganizationListItem = {
  organizationId: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
  isActive: boolean;
  memberCount: number;
  createdAt: ISODateTimeString;
};

export type CreateOrganizationInput = {
  name: string;
  slug: string;
  contactName?: string;
  contactEmail?: string;
  currencyCode: string;
  timezone: string;
  subscriptionPlan: string;
};

export type UpdateOrganizationInput = {
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  currencyCode: string;
  timezone: string;
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

// ---------------------------------------------------------------------------
// Members (org-scoped in admin context)
// ---------------------------------------------------------------------------

export type AdminMember = {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
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
