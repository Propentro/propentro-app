/**
 * address.schema.ts
 *
 * Composable Zod schemas for address objects.
 * Use these in feature schemas that contain a nested address field,
 * rather than repeating individual address field validators everywhere.
 */

import { z } from 'zod';

import {
  nullableCountryCode,
  nullableString,
  requiredCountryCode,
  requiredString,
} from '@/lib/validators';
import type { NullableAddress } from '@/types/address';

// ---------------------------------------------------------------------------
// Internal base schemas
// ---------------------------------------------------------------------------

const _nullableAddressObject = z.object({
  line1: nullableString(),
  line2: nullableString(),
  city: nullableString(),
  region: nullableString(),
  postalCode: nullableString(),
  countryCode: nullableCountryCode(),
});

const _requiredAddressObject = z.object({
  line1: requiredString('Street address'),
  line2: nullableString(),
  city: requiredString('City'),
  region: requiredString('State / Province'),
  postalCode: requiredString('Postal code'),
  countryCode: requiredCountryCode(),
});

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

/**
 * If every field on the parsed address object is null, treat the whole
 * address as absent and return null. This prevents storing empty address
 * objects in the DB when the user left the address section blank.
 */
function normalizeAddress(
  address: NullableAddress | null
): NullableAddress | null {
  if (!address) return null;
  const hasValue = Object.values(address).some((v) => v !== null);
  return hasValue ? address : null;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/** All core address fields are required. */
export function requiredAddress() {
  return _requiredAddressObject;
}

/**
 * All fields are nullable. An object where every field is null (i.e. user
 * left the section empty) is normalised to null.
 *
 * Output: NullableAddress | null
 * Use for CREATE payloads.
 */
export function nullableAddress() {
  return _nullableAddressObject
    .transform(normalizeAddress)
    .pipe(z.custom<NullableAddress | null>());
}

/**
 * Same as nullableAddress but the whole field is also optional (undefined).
 *
 * Output: NullableAddress | null | undefined
 * Use for PATCH payloads where the address may be omitted entirely.
 */
export function optionalAddress() {
  return _nullableAddressObject
    .transform(normalizeAddress)
    .pipe(z.custom<NullableAddress | null>())
    .optional();
}
