import { z } from 'zod';

import { requiredEmail, requiredString } from '@/lib/validators';

// ---------------------------------------------------------------------------
// Invite Member
// ---------------------------------------------------------------------------

export const inviteMemberSchema = z.object({
  email: requiredEmail('Email'),
  roleId: requiredString('Role'),
});

/** No transforms — Input and Output are identical. Use for both Form<> and mutation. */
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const inviteMemberDefaults: InviteMemberInput = {
  email: '',
  roleId: '',
};

// ---------------------------------------------------------------------------
// Update Member Roles
// ---------------------------------------------------------------------------

export const updateMemberRolesSchema = z.object({
  roleIds: z.array(z.string()).min(1, 'Select at least one role'),
});

/** No transforms — Input and Output are identical. Use for both Form<> and mutation. */
export type UpdateMemberRolesInput = z.infer<typeof updateMemberRolesSchema>;
