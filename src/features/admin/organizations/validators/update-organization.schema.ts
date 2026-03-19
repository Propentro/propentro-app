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
  slug: requiredString('Slug').max(100),
  contactName: nullableString(),
  contactEmail: nullableEmail(),
  contactPhone: nullablePhone(),
  currencyCode: currencyCodeSchema,
  timezone: timezoneSchema,
  addressLine1: nullableString(),
  addressLine2: nullableString(),
  city: nullableString(),
  region: nullableString(),
  postalCode: nullableString(),
  countryCode: nullableString(),
  legalName: nullableString(),
  taxNumber: nullableString(),
  taxCountry: nullableString(),
});

export type UpdateOrganizationFormValues = z.input<
  typeof updateOrganizationSchema
>;
