import { z } from 'zod';

import {
  currencyCodeSchema,
  nullableEmail,
  nullablePhone,
  nullableString,
  requiredString,
  timezoneSchema,
} from '@/lib/validators';

export const updateOrganizationSchema = z.object({
  name: requiredString('Name').max(200),
  contactName: nullableString(),
  contactEmail: nullableEmail(),
  contactPhone: nullablePhone(),
  currencyCode: currencyCodeSchema,
  timezone: timezoneSchema,
});

export type UpdateOrganizationFormValues = z.input<
  typeof updateOrganizationSchema
>;
