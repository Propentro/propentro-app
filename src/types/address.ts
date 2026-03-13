/**
 * Shared address types used across API responses and form schemas.
 */

/** Address where all fields may be absent (optional DB columns). */
export type NullableAddress = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  countryCode: string | null;
};
