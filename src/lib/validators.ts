/**
 * validators.ts
 *
 * Reusable Zod v4 schema primitives. Use these across all feature schemas
 * instead of repeating the same validation logic.
 *
 * Pattern: required / optional / nullable triad for each type.
 *   - required   → must have a non-empty value
 *   - optional   → absent or empty string → null  (PATCH payloads)
 *   - nullable   → always present but may be null  (CREATE payloads)
 *
 * IMPORTANT: optional* and nullable* helpers use z.transform() NOT z.preprocess().
 * This ensures z.input<typeof schema> gives a meaningful type (string, not unknown),
 * which is required for the Form<Input> + SubmitHandler<Input> pattern.
 *
 * z.input<>  = form state type  (always string for text inputs)
 * z.output<> = API payload type (string | null after transform)
 */

import { isValidPhoneNumber } from 'libphonenumber-js/min';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function trimToNull(v: string): string | null {
  const trimmed = v.trim();
  return trimmed.length === 0 ? null : trimmed;
}

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

export const slugSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug can only contain lowercase letters, numbers, and hyphens'
  );

// ---------------------------------------------------------------------------
// Strings
// ---------------------------------------------------------------------------

export function requiredString(label?: string) {
  const fieldName = label ?? 'This field';
  return z.string().trim().min(1, `${fieldName} is required`);
}

/** Output: string | null */
export function nullableString() {
  return z.string().transform(trimToNull);
}

/** Output: string | null */
export function optionalString() {
  return z.string().transform(trimToNull);
}

// ---------------------------------------------------------------------------
// Contact — Email
// ---------------------------------------------------------------------------

export function requiredEmail(label?: string) {
  const fieldName = label ?? 'Email';
  return z
    .string()
    .min(1, `${fieldName} is required`)
    .check(z.email({ error: 'Please enter a valid email address' }));
}

/** Output: string | null */
export function nullableEmail() {
  return z
    .string()
    .transform(trimToNull)
    .pipe(
      z
        .string()
        .check(z.email({ error: 'Please enter a valid email address' }))
        .nullable()
    );
}

/** Output: string | null */
export function optionalEmail() {
  return z
    .string()
    .transform(trimToNull)
    .pipe(
      z
        .string()
        .check(z.email({ error: 'Please enter a valid email address' }))
        .nullable()
    );
}

// ---------------------------------------------------------------------------
// Contact — Phone
// ---------------------------------------------------------------------------
//
// Phone numbers are stored in E.164 format (+905551234567).
// The PhoneNumber UI component handles the flag/country-code picker and
// formats the value to E.164 before storing it in form state.
// libphonenumber-js validates the E.164 string here.

export function requiredPhone(label?: string) {
  const fieldName = label ?? 'Phone number';
  return z
    .string()
    .min(1, `${fieldName} is required`)
    .refine(isValidPhoneNumber, { message: 'Please enter a valid phone number' });
}

/** Output: string | null */
export function nullablePhone() {
  return z
    .string()
    .transform(trimToNull)
    .pipe(
      z
        .string()
        .refine(isValidPhoneNumber, {
          message: 'Please enter a valid phone number',
        })
        .nullable()
    );
}

/** Output: string | null */
export function optionalPhone() {
  return z
    .string()
    .transform(trimToNull)
    .pipe(
      z
        .string()
        .refine(isValidPhoneNumber, {
          message: 'Please enter a valid phone number',
        })
        .nullable()
    );
}

// ---------------------------------------------------------------------------
// Geography
// ---------------------------------------------------------------------------

/** ISO 3166-1 alpha-2, normalised to uppercase. */
const _countryCode = z
  .string()
  .length(2, 'Please select a valid country')
  .transform((code) => code.toUpperCase());

export function requiredCountryCode() {
  return _countryCode;
}

/** Output: string | null */
export function nullableCountryCode() {
  return z
    .string()
    .transform((v) => {
      const trimmed = v.trim();
      return trimmed.length === 0 ? null : trimmed.toUpperCase();
    })
    .pipe(z.string().length(2, 'Please select a valid country').nullable());
}

/** Output: string | null */
export function optionalCountryCode() {
  return z
    .string()
    .transform((v) => {
      const trimmed = v.trim();
      return trimmed.length === 0 ? null : trimmed.toUpperCase();
    })
    .pipe(z.string().length(2, 'Please select a valid country').nullable());
}

// ---------------------------------------------------------------------------
// Date & Time  (Zod v4 native ISO helpers)
// ---------------------------------------------------------------------------

/** ISO 8601 date string — e.g. "2026-01-07" */
export const isoDateSchema = z.iso.date({
  error: 'Please enter a valid date (YYYY-MM-DD)',
});

/** ISO 8601 datetime string — e.g. "2026-01-07T14:30:00Z" */
export const isoDateTimeSchema = z.iso.datetime({
  error: 'Please enter a valid date and time',
});

// ---------------------------------------------------------------------------
// Financial
// ---------------------------------------------------------------------------

/** ISO 4217 currency code — e.g. "USD", "EUR", "TRY" */
export const currencyCodeSchema = z
  .string()
  .length(3, 'Please select a valid currency');

/** IANA timezone identifier — e.g. "Europe/Istanbul", "UTC" */
export const timezoneSchema = z.string().min(1, 'Please select a timezone');

/**
 * Non-negative integer representing a monetary amount in the smallest unit
 * (cents, kuruş, etc.). Use this for all money stored as integers in the DB.
 */
export const moneyAmountSchema = z
  .number({ error: 'Please enter a valid amount' })
  .int('Amount must be a whole number')
  .nonnegative('Amount cannot be negative');
