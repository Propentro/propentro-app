import type { DateTimeFormatOptions } from 'next-intl';

export const DATE_PRESETS = {
  short: { dateStyle: 'short' } as DateTimeFormatOptions,
  medium: { dateStyle: 'medium' } as DateTimeFormatOptions,
  long: { dateStyle: 'long' } as DateTimeFormatOptions,
  dateTime: {
    dateStyle: 'medium',
    timeStyle: 'short',
  } as DateTimeFormatOptions,
};
