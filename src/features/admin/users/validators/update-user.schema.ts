import { z } from 'zod';

export const updateUserSchema = z.object({
  firstName: z
    .string()
    .max(100)
    .transform((v) => v.trim() || null),
  lastName: z
    .string()
    .max(100)
    .transform((v) => v.trim() || null),
});

export type UpdateUserInput = z.input<typeof updateUserSchema>;
export type UpdateUserOutput = z.output<typeof updateUserSchema>;

export const updateUserDefaults: UpdateUserInput = {
  firstName: '',
  lastName: '',
};
