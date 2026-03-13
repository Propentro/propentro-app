import { z } from 'zod';

import {
  currencyCodeSchema,
  optionalCountryCode,
  optionalEmail,
  optionalPhone,
  optionalString,
  requiredString,
  timezoneSchema,
} from '@/lib/validators';

// ---------------------------------------------------------------------------
// Organisation Settings
// ---------------------------------------------------------------------------

export const orgSettingsSchema = z.object({
  // Display name
  name: requiredString('Organization name'),

  // Primary contact
  contactName: optionalString(),
  contactEmail: optionalEmail(),
  contactPhone: optionalPhone(),

  // Company address
  addressLine1: optionalString(),
  addressLine2: optionalString(),
  city: optionalString(),
  region: optionalString(),
  postalCode: optionalString(),
  countryCode: optionalCountryCode(),

  // Legal / tax
  legalName: optionalString(),
  taxNumber: optionalString(),
  taxCountry: optionalCountryCode(),

  // Business settings — ISO 4217 / IANA identifiers stored in DB
  currencyCode: currencyCodeSchema,
  timezone: timezoneSchema,
});

/** Form state type — what RHF sees (all string inputs before transform). */
export type OrgSettingsInput = z.input<typeof orgSettingsSchema>;

/** API payload type — what the mutation sends after Zod transforms. */
export type OrgSettingsOutput = z.output<typeof orgSettingsSchema>;

export const orgSettingsDefaults: OrgSettingsInput = {
  name: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  region: '',
  postalCode: '',
  countryCode: '',
  legalName: '',
  taxNumber: '',
  taxCountry: '',
  currencyCode: 'EUR',
  timezone: 'UTC',
};
