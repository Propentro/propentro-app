import dayjs from 'dayjs';

export function formatDate(
  date?: string | Date | null,
  format: string = 'DD MMM, YYYY'
): string {
  if (!date) return '';
  return dayjs(date).format(format);
}

export function formatDateTime(
  date?: string | Date | null,
  format: string = 'DD MMM, YYYY HH:mm'
): string {
  if (!date) return '';
  return dayjs(date).format(format);
}

/**
 * Returns a relative date description.
 *
 * Requires a translate function so the output respects i18n.
 * Pass `t` from `useTranslations('common.dates')`.
 *
 * Expected keys: `today`, `yesterday`, `daysAgo` (ICU plural: {count}).
 */
export function formatRelativeDate(
  date: string | Date | null | undefined,
  t: (key: string, values?: Record<string, unknown>) => string
): string {
  if (!date) return '';
  const d = dayjs(date);
  const now = dayjs();
  const diffDays = now.diff(d, 'day');

  if (diffDays === 0) return t('today');
  if (diffDays === 1) return t('yesterday');
  if (diffDays < 7) return t('daysAgo', { count: diffDays });
  return d.format('DD MMM, YYYY');
}
