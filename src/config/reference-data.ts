/**
 * reference-data.ts
 *
 * Static reference data for form selects: countries, currencies, timezones.
 */

import { countries, type TCountryCode } from 'countries-list';

// ---------------------------------------------------------------------------
// Countries
// ---------------------------------------------------------------------------

const PRIORITY_COUNTRY_CODES: TCountryCode[] = [
  'GB',
  'IE',
  'TR',
  'DE',
  'US',
  'AE',
  'NL',
  'FR',
  'ES',
  'IT',
];

export type SelectOption = { label: string; value: string };

function getFlagEmoji(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

function buildCountryOption(code: TCountryCode): SelectOption {
  const c = countries[code];
  return { label: `${getFlagEmoji(code)}  ${c.name}`, value: code };
}

const priorityCountryOptions: SelectOption[] =
  PRIORITY_COUNTRY_CODES.filter((code) => code in countries).map(
    buildCountryOption
  );

const restCountryOptions: SelectOption[] = (
  Object.keys(countries) as TCountryCode[]
)
  .filter((code) => !PRIORITY_COUNTRY_CODES.includes(code))
  .sort((a, b) => countries[a].name.localeCompare(countries[b].name))
  .map(buildCountryOption);

export const countryOptions: SelectOption[] = [
  ...priorityCountryOptions,
  ...restCountryOptions,
];

export function getCountryName(code: string): string {
  return countries[code as TCountryCode]?.name ?? code;
}

// ---------------------------------------------------------------------------
// Currencies
// ---------------------------------------------------------------------------

const CURRENCY_DEFS: { code: string; name: string }[] = [
  { code: 'EUR', name: 'Euro' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'PLN', name: 'Polish Złoty' },
  { code: 'CZK', name: 'Czech Koruna' },
  { code: 'HUF', name: 'Hungarian Forint' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'QAR', name: 'Qatari Riyal' },
  { code: 'KWD', name: 'Kuwaiti Dinar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'ZAR', name: 'South African Rand' },
];

function getCurrencySymbol(code: string): string {
  try {
    const parts = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    return parts.find((p) => p.type === 'currency')?.value ?? code;
  } catch {
    return code;
  }
}

export const currencyOptions: SelectOption[] = CURRENCY_DEFS.map(
  ({ code, name }) => ({
    label: `${name} (${getCurrencySymbol(code)})`,
    value: code,
  })
);

export function getCurrencyLabel(code: string): string {
  return currencyOptions.find((o) => o.value === code)?.label ?? code;
}

// ---------------------------------------------------------------------------
// Timezones
// ---------------------------------------------------------------------------

const TIMEZONE_IDS: string[] = [
  'UTC',
  'Europe/London',
  'Europe/Dublin',
  'Europe/Lisbon',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Brussels',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Zurich',
  'Europe/Vienna',
  'Europe/Stockholm',
  'Europe/Oslo',
  'Europe/Copenhagen',
  'Europe/Warsaw',
  'Europe/Prague',
  'Europe/Budapest',
  'Europe/Bucharest',
  'Europe/Athens',
  'Europe/Helsinki',
  'Europe/Kyiv',
  'Europe/Istanbul',
  'Europe/Moscow',
  'Asia/Riyadh',
  'Asia/Kuwait',
  'Asia/Qatar',
  'Asia/Dubai',
  'Asia/Bahrain',
  'Asia/Jerusalem',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Ho_Chi_Minh',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Taipei',
  'Asia/Tokyo',
  'Asia/Seoul',
  'America/Halifax',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Lima',
  'Australia/Perth',
  'Australia/Darwin',
  'Australia/Adelaide',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Pacific/Auckland',
  'Pacific/Honolulu',
];

function getTimezoneOffsetLabel(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}

export const timezoneOptions: SelectOption[] = TIMEZONE_IDS.filter((tz) => {
  try {
    Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}).map((tz) => {
  const offset = getTimezoneOffsetLabel(tz);
  return { label: offset ? `${tz} (${offset})` : tz, value: tz };
});
