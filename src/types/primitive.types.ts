// ---------------------------------------------------------------------------
// Primitive type aliases
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// IDs
// ---------------------------------------------------------------------------

/**
 * Known entity prefixes for public IDs.
 * Compile-time safety: typos like `'prpp'` will error.
 */
export type IdPrefix =
  | 'usr' // User
  | 'org' // Organization
  | 'rol' // Role
  | 'inv'; // Invite

/**
 * Prefixed public ID — e.g. `"usr_x7k2m9"`.
 * Internal UUIDs are never exposed to the frontend.
 */
export type Id<TPrefix extends IdPrefix = IdPrefix> = `${TPrefix}_${string}`;

/** URL-safe identifier segment — lowercase letters, numbers, hyphens. */
export type Slug = string;

// ---------------------------------------------------------------------------
// Date & Time
// ---------------------------------------------------------------------------

/** ISO 8601 date-time string in UTC. */
export type ISODateTimeString = string;

/** ISO 8601 date-only string. */
export type ISODateString = string;

/** IANA timezone identifier. */
export type Timezone = string;

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

/** RFC 5321 email address. */
export type Email = string;

/** E.164 formatted phone number. */
export type PhoneNumber = string;

// ---------------------------------------------------------------------------
// Geography
// ---------------------------------------------------------------------------

/** ISO 3166-1 alpha-2 country code (2 uppercase letters). */
export type CountryCode = string;

// ---------------------------------------------------------------------------
// Financial
// ---------------------------------------------------------------------------

/** ISO 4217 currency code (3 uppercase letters). */
export type CurrencyCode = string;

/** Monetary amount in the smallest currency unit (cents, kuruş, pence). */
export type MoneyAmount = number;

// ---------------------------------------------------------------------------
// Files & Media
// ---------------------------------------------------------------------------

/** IANA media type string. */
export type MimeType = string;

/** File size in bytes. */
export type FileSize = number;

/** Absolute URL pointing to a stored file or image. */
export type FileUrl = string;
