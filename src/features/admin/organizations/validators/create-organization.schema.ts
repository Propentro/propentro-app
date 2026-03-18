import { z } from 'zod';

import {
  currencyCodeSchema,
  requiredString,
  slugSchema,
  timezoneSchema,
} from '@/lib/validators';

export const createOrganizationSchema = z.object({
  name: requiredString('Name').max(100),
  slug: slugSchema.max(100),
  currencyCode: currencyCodeSchema,
  timezone: timezoneSchema,
});

export type CreateOrganizationFormValues = z.input<
  typeof createOrganizationSchema
>;

export const createOrganizationDefaults: CreateOrganizationFormValues = {
  name: '',
  slug: '',
  currencyCode: '',
  timezone: '',
};
