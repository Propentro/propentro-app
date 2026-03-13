import { z } from 'zod';

import { nullableString, requiredString } from '@/lib/validators';

// ---------------------------------------------------------------------------
// Create Role
// ---------------------------------------------------------------------------

export const createRoleSchema = z.object({
  name: requiredString('Role name'),
  description: nullableString(),
  permissionCodes: z.array(z.string()).min(1, 'Select at least one permission'),
});

/** Form state type — what RHF sees (all string inputs before transform). */
export type CreateRoleInput = z.input<typeof createRoleSchema>;

/** API payload type — what the mutation sends after Zod transforms. */
export type CreateRoleOutput = z.output<typeof createRoleSchema>;

export const createRoleDefaults: CreateRoleInput = {
  name: '',
  description: '',
  permissionCodes: [],
};

// ---------------------------------------------------------------------------
// Update Role
// ---------------------------------------------------------------------------

export const updateRoleSchema = z.object({
  name: requiredString('Role name'),
  description: nullableString(),
  permissionCodes: z.array(z.string()).min(1, 'Select at least one permission'),
});

/** Form state type — what RHF sees (all string inputs before transform). */
export type UpdateRoleInput = z.input<typeof updateRoleSchema>;

/** API payload type — what the mutation sends after Zod transforms. */
export type UpdateRoleOutput = z.output<typeof updateRoleSchema>;
